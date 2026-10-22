# Technical SEO discovery audit — October 21, 2026

Base: merged PR 30, main `54f0ac180333baf94d907ae3bfc7da52599bc005`.
Task: https://www.notion.so/401bd080de92814094f9ccb930220c7a

## Live verification before this change

The Blog response contains all 11 article cards without executing JavaScript.
GitHub Pages build/deployment run 39712217368 succeeded; publishing maintenance
run 39712217292 succeeded. Its explicit request-pages-build job skipped because
the generated files were already current. Therefore the normal merge deployment
is verified, while the first changed-output bot handoff remains untested in production.

HTTP and apex Blog requests resolve to HTTPS www. The XML sitemap returns 404.
Live robots.txt contains Cloudflare-managed content-signal explanatory text,
without an XML sitemap reference. CES's canonical points to apex even though the
page's public URL is www. Repository inspection finds nine March articles without
canonical links; Griply and CES use apex canonicals. Public root pages already
declare www canonical URLs.

## Changes

- A standard-library maintenance generator produces sitemap.xml for 24 public
  root pages plus 11 published articles, all on HTTPS www. It excludes private,
  archived, dist, utility-tool and template paths. Explicit noindex pages are
  omitted; duplicate or mismatched root canonicals fail validation.
- Article canonical links are added/corrected to the real dated published URL.
  Existing apex URLs in head metadata normalize to www, including OG/structured
  identity fields. Both canonical article templates follow the same host.
  The article body, title, editorial copy and outbound body links are preserved.
- Root robots.txt allows public crawling and advertises the sitemap. This does
  not modify Cloudflare bot/content-signal settings or replace authentication.
  Confirm how Cloudflare composes the final response after merge.
- The existing publishing-maintenance workflow validates and regenerates the
  sitemap and canonical heads, then stages those explicit outputs with its other
  generated publication files. The existing guarded Pages-build handoff applies
  when generated output changes on main. Cloudflare asset packaging also includes
  sitemap.xml and robots.txt.
- No lastmod dates are fabricated from today's date or filesystem timestamps.
  No search-engine submission, indexing claim or production deployment is made.

## Validation

Parsed XML has the sitemap namespace and 35 unique URLs, all backed by real local
HTML files with matching canonicals. All 11 articles are represented. A second
generation reports zero changes. A future-article fixture adds its canonical and
sitemap URL automatically; a noindex fixture is omitted. Duplicate canonical
markup fails, and invalid input leaves the existing sitemap untouched. Exact-host
normalization leaves lookalike external hosts and every body URL alone. Article
and template body/title comparisons against main pass, allowing only checkout
line-ending differences. Metadata extraction and static-list generation still
validate; the latter reports zero changes.

## Remaining audit items

- First real changed-output bot Pages-build handoff and public robots/sitemap
  response need post-merge verification.
- Nine March articles still lack Article/BlogPosting structured data and social
  metadata. Add only source-backed authorship/dates/images; do not invent them.
- Griply placeholder article content and missing Griply/CES images need editorial
  repair. CES description/body truncation and its missing stylesheet remain open.
- Check Search Console coverage, canonical selection and sitemap processing when
  authenticated data is available; this change cannot guarantee indexing.
- Complete the remaining performance/mobile, content, internal linking and trust
  phases of the audit separately.

## References

- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec

Maintenance commands: python scripts/generate_sitemap.py --check (validate only)
and python scripts/generate_sitemap.py (regenerate). All inputs validate before
writing; each file replacement is atomic. A filesystem failure can leave partial
local files, but CI fails before committing those outputs.
