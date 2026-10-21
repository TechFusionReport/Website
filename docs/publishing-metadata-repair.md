# Publishing metadata repair — October 21, 2026

PR 28 was confirmed merged at `1ecf179338e69c2b92a1850d0c5d4be29f611e63`.
Direct HTTP checks returned 200 for the public Blog and post-listings.js;
the public Blog response includes both the CES fallback and the new script.
The search fetch initially returned older cached markup, so the delivery check
used the actual HTTP response. This confirms the discovery assets are served,
but does not establish whether GitHub Pages or the Cloudflare Worker delivers them.

## Repair

The previous inline workflow only recognized one exact JSON-LD script spelling,
selected OG metadata over visible headings, ignored ordinary description tags,
missed current breadcrumbs, defaulted every category to Technology and invented
pretty URLs. The replacement standard-library HTML parser handles current March
and September templates, attribute order and quote variations, JSON-LD graphs,
type arrays and image objects/arrays.

Readable h1 headings lead; JSON-LD and OG titles are fallbacks. Descriptions come
from published deks, ordinary description metadata, structured/OG metadata and
usable existing index values. Placeholder descriptions become empty with warnings.
Image and thumbnail stay aligned, using published images or valid existing assets.
No image or editorial description is invented. Explicit article categories and
category breadcrumb links take precedence over old index labels; conflicts or
unsupported explicit labels fail validation. A category absent from the article
can retain an existing recognized category with a review warning, but no default
category is manufactured. Topic and read-time metadata are recovered where present.

Existing slugs, custom fields, feature selections and seoTitle are retained.
URLs always point to actual dated published HTML files. Filename dates are checked
as calendar dates and entries are newest-first. The entire input is validated
before an atomic index replacement. Empty directories, invalid titles/categories,
duplicate index-file records and unrendered Markdown fail without clearing the
existing index. Malformed optional JSON-LD falls back to HTML with a warning.

The workflow validates pull requests without write permission. Push/manual runs
validate first, rebuild and commit only posts.json on their checked-out branch;
there is no force push or automatic merge. A concurrent external update can reject
the normal push safely; rerun the workflow against the latest branch in that case.
The script and workflow themselves trigger validation/rebuild when changed.

## Index changes and remaining review

All 11 articles remain indexed. Nine March titles/descriptions/images are recovered
from their existing published HTML. Seven categories are corrected from article
evidence, producing Technology 4, Entertainment 3, Productivity 4. CES gains
AI Tools and its published reading time. Griply's placeholder description is
suppressed, and its image and CES's image remain empty. Existing article files
are byte-for-byte unchanged.

The CES description/body truncation, absent stylesheet, 2024/2026 context and
Griply's article content remain editorial/template follow-ups. This maintenance
script derives metadata from already-published HTML; it is not a pre-publication
content-quality gate for the upstream Automations Worker. Future no-JavaScript
discovery still needs publication-time static listing regeneration.

## Verification

`python scripts/rebuild_posts_index.py --check` validates all published files without
writing; `python scripts/rebuild_posts_index.py` regenerates posts.json. Fixture
checks cover entities, attribute variations, structured-data variants, preserved
slugs/custom fields, placeholder suppression, unsafe images, missing/conflicting
categories, malformed JSON-LD, deterministic output and failure preservation.
All 11 article paths resolve to real files and article byte hashes remain unchanged.
The existing local 19-page headless Edge listing checks are rerun against the
repaired index, including CES ordering, March records and failure fallbacks.
