import argparse
import datetime
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


CATEGORIES = {name.lower(): name for name in ("Technology", "Entertainment", "Productivity")}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class Element:
    def __init__(self, tag="", attrs=None):
        self.tag = tag
        self.attrs = dict(attrs or [])
        self.children = []

    def text(self):
        return "".join(child.text() if isinstance(child, Element) else child for child in self.children)

    def find_all(self, tag=None, class_name=None):
        found = []
        for child in self.children:
            if isinstance(child, Element):
                if (tag is None or child.tag == tag) and (class_name is None or class_name in child.attrs.get("class", "").split()):
                    found.append(child)
                found.extend(child.find_all(tag, class_name))
        return found


class ArticleParser(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Element()
        self.stack = [self.root]
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        element = Element(tag, attrs)
        self.stack[-1].children.append(element)
        if tag not in VOID_TAGS:
            self.stack.append(element)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for position in range(len(self.stack) - 1, 0, -1):
            if self.stack[position].tag == tag:
                del self.stack[position:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def clean(value):
    return " ".join(value.split()) if isinstance(value, str) else ""


def usable(value):
    return clean(value) if not re.search(r"populates here|\{\{|\[placeholder\]", clean(value), re.I) else ""


def first(*values):
    return next((usable(value) for value in values if usable(value)), "")


def safe_image(value):
    if isinstance(value, list):
        return next((image for item in value if (image := safe_image(item))), "")
    if isinstance(value, dict):
        value = value.get("url") or value.get("contentUrl")
    value = usable(value)
    try:
        parsed = urlsplit(value)
    except ValueError:
        return ""
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return value
    if value.startswith("/") and not value.startswith("//") and not parsed.scheme:
        return value
    return ""


def structured_articles(value):
    if isinstance(value, list):
        return [article for item in value for article in structured_articles(item)]
    if isinstance(value, dict):
        types = value.get("@type", [])
        if isinstance(types, str):
            types = [types]
        matches = [value] if any(kind in ("Article", "BlogPosting", "NewsArticle") for kind in types) else []
        return matches + structured_articles(value.get("@graph", []))
    return []


def extract_post(file, html, previous):
    match = re.fullmatch(r"(\d{4}-\d{2}-\d{2})-(.+)\.html", file)
    if not match:
        raise ValueError(f"Unsupported published filename: {file}")
    date, slug = match.groups()
    datetime.date.fromisoformat(date)
    root = ArticleParser(html).root
    articles = root.find_all("article")
    scope = articles[0] if articles else root
    meta = {element.attrs.get("property") or element.attrs.get("name"): element.attrs.get("content", "") for element in root.find_all("meta")}
    structured = []
    warnings = []
    for script in root.find_all("script"):
        if script.attrs.get("type", "").lower() == "application/ld+json":
            try:
                structured.extend(structured_articles(json.loads(script.text())))
            except (ValueError, TypeError):
                warnings.append("Malformed JSON-LD; used HTML metadata")
    data = structured[0] if structured else {}
    text = lambda elements: clean(elements[0].text()) if elements else ""
    heading = text(scope.find_all("h1"))
    title = first(heading, data.get("headline"), meta.get("og:title"))
    if not title or title == slug or re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+){2,}", title):
        raise ValueError(f"{file}: missing readable article title")
    breadcrumbs = scope.find_all(class_name="breadcrumbs") or scope.find_all(class_name="breadcrumb")
    category_links = []
    for breadcrumb in breadcrumbs:
        for link in breadcrumb.find_all("a"):
            path = urlsplit(link.attrs.get("href", "")).path
            category_match = re.fullmatch(r"/(?:category/)?(technology|entertainment|productivity)(?:\.html|/)?", path)
            if category_match:
                category_links.append(CATEGORIES[category_match[1]])
    candidates = [scope.attrs.get("data-category"), meta.get("article:section"), *category_links, data.get("articleSection")]
    for value in (scope.attrs.get("data-category"), meta.get("article:section")):
        if usable(value) and clean(value).lower() not in CATEGORIES:
            raise ValueError(f"{file}: unsupported published category {value!r}")
    explicit = list(dict.fromkeys(CATEGORIES[clean(value).lower()] for value in candidates if clean(value).lower() in CATEGORIES))
    if len(explicit) > 1:
        raise ValueError(f"{file}: conflicting published categories {explicit}")
    category = explicit[0] if explicit else CATEGORIES.get(clean(previous.get("category")).lower(), "")
    if not category:
        raise ValueError(f"{file}: unknown category; refusing to default to Technology")
    if not explicit:
        warnings.append("No article category; retained existing index category for review")
    description = first(text(scope.find_all(class_name="dek")), meta.get("description"), data.get("description"), meta.get("og:description"), previous.get("excerpt"), previous.get("description"))
    images = scope.find_all("img", "article-image")
    image = next((image for value in [images[0].attrs.get("src") if images else "", meta.get("og:image"), data.get("image"), previous.get("thumbnail"), previous.get("image")] if (image := safe_image(value))), "")
    subcategory = first(scope.attrs.get("data-section"))
    if not subcategory and breadcrumbs:
        parts = [clean(part) for part in re.split(r"/|›", breadcrumbs[0].text()) if clean(part)]
        if parts and parts[-1] not in ("Home", *CATEGORIES.values(), title):
            subcategory = parts[-1]
    subcategory = first(subcategory, previous.get("subcategory"))
    read_time = first(text(scope.find_all(class_name="reading-time")), previous.get("readTime"))
    if not read_time:
        read_time = next((clean(element.text()) for group in scope.find_all(class_name="article-meta") for element in group.find_all("span") if re.fullmatch(r"\d+ min read", clean(element.text()))), "")
    keywords = data.get("keywords") or meta.get("keywords") or meta.get("article:tag")
    tags = [clean(item) for item in keywords.split(",") if clean(item)] if isinstance(keywords, str) else keywords if isinstance(keywords, list) else previous.get("tags", [])
    tags = [item for item in tags if isinstance(item, str) and clean(item)] if isinstance(tags, list) else []
    result = dict(previous)
    result.update(title=title, slug=first(previous.get("slug"), Path(file).stem), date=date, category=category, subcategory=subcategory,
                  readTime=read_time, excerpt=description, description=description, thumbnail=image, image=image,
                  url=f"/_posts/{file}", file=file, tags=tags)
    if not description:
        warnings.append("Missing usable description; editorial cleanup required")
    if not image:
        warnings.append("Missing image; no replacement invented")
    return result, warnings


def rebuild(root):
    posts_dir = root / "_posts"
    files = sorted(posts_dir.glob("*.html"), reverse=True)
    previous = json.loads((root / "posts.json").read_text(encoding="utf-8")) if (root / "posts.json").exists() else []
    if not isinstance(previous, list) or any(not isinstance(post, dict) for post in previous):
        raise ValueError("Existing index must be an array of post objects")
    if not files:
        if previous:
            raise ValueError("No published HTML files but posts.json is not empty; refusing to replace the index")
        return json.dumps([], ensure_ascii=False, indent=2) + "\n"
    if list(posts_dir.glob("*.md")):
        raise ValueError("Markdown posts require an HTML publication step before indexing")
    indexed = {}
    for post in previous:
        file = clean(post.get("file")) or Path(urlsplit(clean(post.get("url"))).path).name
        if file in indexed:
            raise ValueError(f"Duplicate existing file metadata: {file}")
        if file:
            indexed[file] = post
    posts = []
    for file in files:
        post, warnings = extract_post(file.name, file.read_text(encoding="utf-8"), indexed.get(file.name, {}))
        posts.append(post)
        for warning in warnings:
            print(f"WARNING {file.name}: {warning}", file=sys.stderr)
    return json.dumps(posts, ensure_ascii=False, indent=2) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Rebuild the listing index from published HTML without editing articles.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--check", action="store_true", help="Validate extraction without writing the index")
    args = parser.parse_args()
    try:
        content = rebuild(args.root)
        if not args.check:
            temporary = args.root / "posts.json.tmp"
            temporary.write_text(content, encoding="utf-8")
            temporary.replace(args.root / "posts.json")
        print(f"Validated {len(json.loads(content))} published articles" + (" (no files changed)" if args.check else "; rebuilt posts.json"))
    except (ValueError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
