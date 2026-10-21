# Publishing discovery audit — October 21, 2026

Base: `main` at `9492334699e6e1ce1c253adf20b728fd84e1461e`.
`origin/preview` was inspected at `390aeb4`; the user explicitly requested a
new branch from main for this work.

## Evidence

- The root index has 11 records and matching published HTML files, including
  September 27 CES. Existing listing markup contained only March cards.
- Homepage Featured Articles is explicitly curated; preserve those nine cards
  and the Top Story link, and add a separate newest-first Latest carousel.
- March records use `description`, `file`, undated slugs and obsolete pretty
  URLs. CES uses `excerpt`, a dated slug and a real `/_posts/` URL.
- `.github/workflows/rebuild-posts-index.yml` reads JSON-LD/OG but misses March
  h1, description meta tags, article images and current breadcrumbs. It defaults
  every category to Technology and invents pretty URLs that do not match files.
  This explains why repairing just the existing index would not last.
- Tracked `dist/posts.json` lacks CES; `build.sh` recreates dist from root files.
  Actual production delivery remains unconfirmed; this PR does not deploy.

## Display behavior

Lists consume the root index and prefer safe dated `file` paths for legacy
records. Missing titles/descriptions/images come from published HTML. Category
conflicts use explicit published article evidence and emit console warnings.
No slug title-casing, inferred topics, invented descriptions or stock images.
HTML entities decode into text, and card content is inserted as text, not HTML.
Only local published HTML paths are accepted for article links. Unknown
categories are not silently assigned Technology. Stable ISO date sorting and
URL deduplication apply. Requests time out after ten seconds; index failures
retain the existing HTML. Missing images are omitted, and failed images removed.
Empty topic lists retain a reader-facing empty state.

The navigation, category tiles, related-topic links and curated homepage cards
remain static. All 14 subcategory pages can receive new indexed articles,
including lanes that are currently empty. Subcategories require an explicit
index value or article breadcrumb/data-section; no keyword inference.

## Metadata cleanup still required

- Griply: placeholder description and empty image; category Technology conflicts
  with published Productivity. Its article description also contains the
  placeholder, so no description is displayed. Review source content in Notion.
- Nine other March records: raw-slug titles, empty descriptions and images.
  Published headings, deks and images recover their display values.
- Streaming, movie night, music discovery: Technology conflicts with published
  Entertainment. Weekly workflow, office tools and notes app: Technology
  conflicts with published Productivity. Griply is a seventh category conflict.
- CES: missing index image/subcategory/readTime; published data-section and
  reading-time recover the latter two. No image is fabricated. Its excerpt ends
  mid-word, its 2026 publication discusses CES 2024, its HTML ends mid-sentence,
  and it references `/assets/style.css`, which is absent. Editorial and template
  review are needed; these are not rewritten by a discovery fix.
- Repair index extraction in the publishing workflow separately, using real
  article markup and without defaulting unknown categories or manufacturing URLs.
- Static regeneration on publication is still needed for automatic discovery of
  future articles by visitors without JavaScript. Current CES fallback cards are
  included in the initial HTML. Rendering fetches each indexed article to recover
  metadata; a corrected publisher index can later remove this extra work.

## Verification

Local headless browser checks cover all listing pages, newest-first CES placement,
all 11 published article links, March headings and category counts, entity decoding,
placeholder suppression, empty categories, and index-error/no-JavaScript fallbacks.
No production deployment or live delivery-path claim is made.

Result: all checks passed in headless Microsoft Edge on October 21, 2026.
Counts: Latest 9; Blog 11; Technology 4; Entertainment 3; Productivity 4;
AI Tools 2; eight other populated topics 1 each; five empty topics 0.
All 11 published HTML links returned HTTP 200. HTTP 500 and malformed JSON
retained five static Blog cards; JavaScript-disabled Blog also retained those
cards. Reversed input remained newest-first, unsafe/external article URLs were
rejected, and there were no uncaught browser exceptions. Syntax and diff checks
passed (Git configured to recognize the repository's CRLF line endings).
