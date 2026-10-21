# Static article listing regeneration — October 21, 2026

Continues the audit from merged PR 29, main
`baab84cf1dd0f4481efb4d1065bea6088ef05975`.

## Behavior

`python scripts/render_post_listings.py` reads the same published-HTML metadata
extractor as the index rebuild, then refreshes the contents of article-list
containers on Latest, Blog, three categories and all 14 subcategories.
`--check` validates generation and reports how many pages would change without
writing them. The renderer has no third-party dependencies.

Latest contains the newest nine indexed articles. Blog includes all published
articles; categories and subcategories use explicit metadata. Empty topics get
a reader-facing empty state. Card text and attributes are HTML-escaped; no
editorial descriptions or replacement images are invented. All pages are parsed
and validated before the first file write; each changed file is replaced atomically.
Filesystem write failure can still leave a partial local output, but the CI job
fails before its Git commit. Missing or duplicate containers fail validation.

The generator replaces only listing interiors, preserving every byte outside
them: navigation, category tiles, heroes, related-topic links, Top Story and the
curated homepage carousel. Article files and posts.json are not changed by the
renderer. The existing runtime listing enhancement remains in place.

The publishing-index workflow runs the renderer after index extraction and
commits only the index and the explicit 19-page output list. Pull requests run
read-only generation validation. Publication or renderer changes trigger the
workflow. Generated HTML is tracked so delivery does not need a Python runtime.

## Verification

- All 19 pages generate deterministically; a second run reports zero changes.
- Byte comparisons against main confirm only article-list interiors changed,
  including preservation of the curated homepage carousel and all navigation.
- A temporary future publication appears first in the initial HTML of Latest,
  Blog, Technology and AI Tools, and does not leak into Entertainment.
- Fixture titles containing ampersands and angle brackets are escaped as text.
- A missing-container fixture fails without modifying any page.
- Headless Edge checks cover all 19 pages both with and without JavaScript,
  CES ordering, March articles, category counts and index-loading failures.

## Remaining boundaries

This prepares fresh static HTML in the Git publication record. Confirm the actual
production delivery source and its response to bot-generated commits before
claiming automatic end-to-end deployment. GitHub Actions-generated commits do not
necessarily start another deployment workflow; the current rebuild commit also
retains its existing skip-ci marker. This PR does not change or promote production
deployments. The runtime enhancement still provides immediate discovery from the
live index while the static output awaits delivery.

Griply placeholder article content, missing Griply/CES images, CES truncation and
template issues, and upstream pre-publication quality gates remain separate work.
