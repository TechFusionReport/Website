import argparse
import re
import sys
from pathlib import Path
from html import escape
from xml.etree import ElementTree

from rebuild_posts_index import ArticleParser
from render_post_listings import PAGES


BASE_URL = "https://www.techfusionreport.com"
NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
PUBLIC_PAGES = [*PAGES, "about.html", "contact.html", "privacy.html", "terms.html", "sitemap.html"]
TEMPLATES = ["blog-post-template.html", "article-template..html.html"]


def canonical_links(html):
    return [element for element in ArticleParser(html).root.find_all("link")
            if "canonical" in (element.attrs.get("rel") or "").lower().split()]


def normalize_article(html, url):
    head_end = re.search(r"</head\s*>", html, re.I)
    if not head_end:
        raise ValueError("Published article has no closing head element")
    head, body = html[:head_end.start()], html[head_end.start():]
    matches = [match for match in re.finditer(r"<link\b[^>]*>", head, re.I) if canonical_links(match.group())]
    if len(matches) > 1:
        raise ValueError("Multiple article canonical links require manual review")
    canonical = f'<link rel="canonical" href="{escape(url, quote=True)}">'
    if matches:
        match = matches[0]
        head = head[:match.start()] + canonical + head[match.end():]
    else:
        newline = "\r\n" if "\r\n" in html else "\n"
        head, count = re.subn(r"(<head\b[^>]*>)", lambda match: match.group() + newline + "  " + canonical, head, count=1, flags=re.I)
        if count != 1:
            raise ValueError("Published article has no opening head element")
    head = re.sub(r"https://techfusionreport\.com(?=[/?#\"'\s<>]|$)", BASE_URL, head)
    return head + body


def generate(root):
    output = {}
    urls = []
    for filename in PUBLIC_PAGES:
        path = root / filename
        html = path.read_bytes().decode("utf-8")
        url = BASE_URL + ("/" if filename == "index.html" else "/" + filename)
        links = canonical_links(html)
        if len(links) != 1 or links[0].attrs.get("href") != url:
            raise ValueError(f"{filename}: canonical differs from expected public URL")
        robots = [element.attrs.get("content", "").lower() for element in ArticleParser(html).root.find_all("meta") if element.attrs.get("name", "").lower() == "robots"]
        if any("noindex" in policy for policy in robots):
            continue
        urls.append(url)
    articles = sorted((root / "_posts").glob("*.html"), reverse=True)
    if not articles:
        raise ValueError("No published articles; refusing to generate an incomplete sitemap")
    for path in articles:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9_-]*\.html", path.name):
            raise ValueError(f"Unsupported published article filename: {path.name}")
        url = BASE_URL + "/_posts/" + path.name
        html = path.read_bytes().decode("utf-8")
        normalized = normalize_article(html, url)
        output[path] = normalized.encode("utf-8")
        robots = [element.attrs.get("content", "").lower() for element in ArticleParser(html).root.find_all("meta") if element.attrs.get("name", "").lower() == "robots"]
        if not any("noindex" in policy for policy in robots):
            urls.append(url)
    for filename in TEMPLATES:
        path = root / filename
        html = path.read_bytes().decode("utf-8")
        output[path] = normalize_article(html, BASE_URL + "/_posts/{{SLUG}}.html").encode("utf-8")
    if len(set(urls)) != len(urls):
        raise ValueError("Duplicate sitemap URLs")
    ElementTree.register_namespace("", NAMESPACE)
    sitemap = ElementTree.Element(f"{{{NAMESPACE}}}urlset")
    for url in urls:
        entry = ElementTree.SubElement(sitemap, f"{{{NAMESPACE}}}url")
        ElementTree.SubElement(entry, f"{{{NAMESPACE}}}loc").text = url
    ElementTree.indent(sitemap, space="  ")
    output[root / "sitemap.xml"] = ElementTree.tostring(sitemap, encoding="utf-8", xml_declaration=True) + b"\n"
    return output, len(urls)


def main():
    parser = argparse.ArgumentParser(description="Generate canonical XML sitemap and align article head URLs without changing article bodies.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--check", action="store_true", help="Validate all sitemap inputs without writing")
    args = parser.parse_args()
    try:
        output, count = generate(args.root)
        changed = [path for path, content in output.items() if not path.exists() or path.read_bytes() != content]
        if not args.check:
            for path in changed:
                temporary = path.with_name(path.name + ".tmp")
                temporary.write_bytes(output[path])
                temporary.replace(path)
        print(f"Validated {count} sitemap URLs; {len(changed)} files " + ("would change" if args.check else "updated"))
    except (ValueError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
