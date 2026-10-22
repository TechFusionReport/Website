import argparse
import datetime
import json
import sys
from html import escape
from html.parser import HTMLParser
from pathlib import Path

from rebuild_posts_index import VOID_TAGS, rebuild, safe_image


PAGES = {
    "index.html": ("", ""), "blog.html": ("", ""),
    "technology.html": ("Technology", ""), "entertainment.html": ("Entertainment", ""),
    "productivity.html": ("Productivity", ""), "ai.html": ("Technology", "AI Tools"),
    "smartphones.html": ("Technology", "Smartphones"), "smart_home.html": ("Technology", "Smart Home"),
    "android_apps.html": ("Technology", "Android Apps"), "mac-apps.html": ("Technology", "Mac Apps"),
    "smartphone-apps.html": ("Technology", "Smartphone Apps"), "tips_tricks.html": ("Technology", "Tips & Tricks"),
    "gtk_websites.html": ("Technology", "Good to Know Websites"), "movies.html": ("Entertainment", "Movies"),
    "tv_shows.html": ("Entertainment", "TV Shows"), "music.html": ("Entertainment", "Music"),
    "office.html": ("Productivity", "Office Tools"), "workflows.html": ("Productivity", "Workflows"),
    "productivity_apps.html": ("Productivity", "Productivity Apps"),
}


class ListingRanges(HTMLParser):
    def __init__(self, source, homepage=False, category=False):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.offsets = [0]
        for line in source.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.homepage = homepage
        self.category = category
        self.stack = []
        self.ranges = {}
        self.feed(source)
        self.close()

    def absolute_position(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = (attributes.get("class") or "").split()
        target = ""
        if self.homepage and "latest-carousel" in classes and "data-curated" not in attributes:
            target = "cards"
        elif not self.homepage and "magazine-grid" in classes:
            target = "cards"
        elif self.category and "category-blog-index" in classes:
            target = "index"
        if tag not in VOID_TAGS:
            self.stack.append((tag, target, self.absolute_position() + len(self.get_starttag_text())))

    def handle_endtag(self, tag):
        for position in range(len(self.stack) - 1, -1, -1):
            if self.stack[position][0] == tag:
                _, target, start = self.stack[position]
                if target:
                    if target in self.ranges:
                        raise ValueError(f"Multiple {target} listing containers")
                    self.ranges[target] = (start, self.absolute_position())
                del self.stack[position:]
                break


def card(post, position, carousel=False):
    category = escape(post["category"].lower(), quote=True)
    classes = ("carousel-card" if carousel else "post-card") + " " + category
    if not carousel and position == 0:
        classes += " feature-card"
    content = []
    image = safe_image(post.get("thumbnail") or post.get("image"))
    if image:
        image_class = "" if carousel else ' class="post-thumb"'
        content.append(f'<img{image_class} src="{escape(image, quote=True)}" alt="" loading="lazy">')
    content.append(f'<span class="label">{escape(post["category"])}</span><h3>{escape(post["title"])}</h3>')
    if post.get("excerpt"):
        content.append(f'<p>{escape(post["excerpt"])}</p>')
    meta = []
    if post.get("subcategory"):
        meta.append(f'<span>{escape(post["subcategory"])}</span>')
    date = datetime.date.fromisoformat(post["date"])
    display_date = f'{date.strftime("%b")} {date.day}, {date.year}'
    meta.append(f'<time datetime="{post["date"]}">{display_date}</time>')
    if post.get("readTime"):
        meta.append(f'<span>{escape(post["readTime"])}</span>')
    content.append('<div class="meta">' + "".join(meta) + '</div>')
    return f'<article class="{classes}"><a href="{escape(post["url"], quote=True)}">' + "".join(content) + '</a></article>'


def render(root):
    posts = json.loads(rebuild(root))
    output = {}
    for filename, (category, topic) in PAGES.items():
        path = root / filename
        source = path.read_bytes().decode("utf-8")
        selected = [post for post in posts if (not category or post["category"] == category) and (not topic or post.get("subcategory") == topic)]
        homepage = filename == "index.html"
        if homepage:
            selected = selected[:9]
        parser = ListingRanges(source, homepage=homepage, category=bool(category and not topic))
        expected = {"cards", "index"} if category and not topic else {"cards"}
        if set(parser.ranges) != expected:
            raise ValueError(f"{filename}: missing or ambiguous listing containers")
        cards = "".join(card(post, position, homepage) for position, post in enumerate(selected))
        replacements = {"cards": cards or '<p class="empty-note">No articles published in this section yet.</p>'}
        if "index" in expected:
            replacements["index"] = "".join(f'<a href="{escape(post["url"], quote=True)}">{escape(post["title"])}<span>{escape(post.get("subcategory", ""))}</span></a>' for post in selected)
        for target, (start, end) in sorted(parser.ranges.items(), key=lambda item: item[1][0], reverse=True):
            source = source[:start] + replacements[target] + source[end:]
        output[path] = source.encode("utf-8")
    return output


def main():
    parser = argparse.ArgumentParser(description="Bake published article listings into existing page HTML.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--check", action="store_true", help="Validate generation without changing pages")
    args = parser.parse_args()
    try:
        output = render(args.root)
        changed = [path for path, content in output.items() if path.read_bytes() != content]
        if not args.check:
            for path in changed:
                temporary = path.with_suffix(".html.tmp")
                temporary.write_bytes(output[path])
                temporary.replace(path)
        print(f"Validated {len(output)} listing pages; {len(changed)} " + ("would change" if args.check else "updated"))
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
