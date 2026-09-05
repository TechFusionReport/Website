# Agents.md — TechFusion Report Website

This file provides persistent context for AI agents (Claude Code, Codex, ChatGPT, or
any other assistant) working in this repository. Read this before taking
any action in the codebase.

Always commit and push changes to the `preview` branch only. Never push
directly to `main`.

---

## 🗣️ Terminology & Shorthand

| What Justin Says | What It Means |
|---|---|
| **the site / the website** | techfusionreport.com — this repo's public frontend |
| **the blog** | `blog.html` (category hub) and individual post pages |
| **posts** | HTML files in `_posts/YYYY-MM-DD-slug.html` |
| **posts.json** | JSON index the homepage/category/blog pages read to populate article cards |
| **the homepage** | `index.html` |
| **category pages** | `technology.html`, `entertainment.html`, `productivity.html` — live |
| **the pipeline** | Cloudflare Workers backend in the Automations repo — NOT this repo |
| **the ops panel / command center / TechFusion OS** | `/ops/` — Access-gated internal control surface. Lives in this repo, but is a separate concern from the public site |
| **deploy it** | Commit to `preview` → human reviews → merge to `main` → deploys |
| **brand assets** | Images under `/graphics/` or `https://www.techfusionreport.com/graphics/...` |
| **task tracker** | Master Task Tracker (`30e1920a-4e2e-4dfc-8715-77aedd2115f8`) |
| **dev log** | Blog Automation Dev Log (`313bd080-de92-8159-bcee-c3fc4ed83462`) |

---

## 🏢 Project Identity

TechFusion Report is a professional publication at `techfusionreport.com`
covering **Technology**, **Entertainment**, and **Productivity**. Public
site decisions should favor production stability, editorial clarity,
design quality, and pipeline compatibility. This is a business project —
treat it that way.

---

## 🏗️ Stack Overview

- **Domain:** `techfusionreport.com` / `www.techfusionreport.com` via
  Cloudflare DNS
- **Delivery:** documented as GitHub Pages serving `main`. **Unconfirmed
  as of 2026-08-23** — a Cloudflare Worker named `website` also builds
  from every push (via `wrangler versions upload`), but those builds are
  not auto-promoted to production traffic. Verify the actual production
  source in the Cloudflare dashboard (Workers & Pages → `website` →
  Settings → Build) before assuming either path is definitively the live
  one. Don't silently "fix" this note without checking first.
- **Build tooling:** none — pure HTML/CSS/JS, no Node.js, no bundler
- **Pipeline owner:** Cloudflare Workers in the Automations repo, not
  this repo
- **Editorial source of truth:** Notion `Content Catalog v2`
- **Published files:** `_posts/*.html` plus `posts.json`

---

## Two Surfaces, One Repo

This repo serves two separate things. Don't cross the streams.

1. **Public site** — `index.html`, `blog.html`, `technology.html`,
   `entertainment.html`, `productivity.html`, `_posts/`,
   `blog-post-template.html`, `article-template..html.html`, `style.css`,
   `posts.json`. Reader-facing, editorial tone. Never add
   dashboard/command-surface/pipeline language here.
2. **`/ops/`** — TechFusion OS, the Access-gated internal control surface
   (Command Center, Review Queue, Draft Review, Content Catalog, Errors,
   plus planned modules: Agents & Automation, AI/OmniRoute,
   Infrastructure, Development, Work, Analytics & Business, System).
   Operational tone is fine here — it's gated, `noindex, nofollow`,
   internal only. Canonical implementation-boundary doc:
   `docs/techfusion-os.md`. Cross-system ownership and architecture live
   in Notion (**TechFusion OS — Architecture & Documentation Contract**),
   not in repo docs. `/ops/api/*`, auth, and backend integrations belong
   to the Automations repo, not this one.

Changes to one surface shouldn't touch the other unless the task
explicitly spans both.

---

## Current Frontend Direction (public site)

As of 2026-08-23, `preview` contains the replacement public-facing blog
frontend:

- Homepage: large animated TechFusion Report logo hero, simplified first
  viewport, latest-9 horizontal carousel.
- Blog page (`blog.html`): category hub for Technology, Entertainment,
  and Productivity.
- Category pages: `technology.html`, `entertainment.html`,
  `productivity.html` — each shows only that section's articles.
- Articles: static HTML in `_posts/YYYY-MM-DD-slug.html`, generated from
  `blog-post-template.html`.
- Shared styles: `style.css`.

Do not replace the public site with a command-center/dashboard UI —
that's what `/ops/` is for.

---

## Nav, Subcategory Pages, and Design-System Elements Are Baked, Not Client-Rendered

As of 2026-08-29, every page's header (icon-dropdown `nav-group`/`nav-panel`/
`nav-card`), the `pcb-panel` hero texture, `topic-card-grid` on the three
category hub pages, the homepage `destination-card` section, and all 14
subcategory pages (`ai.html`, `movies.html`, etc.) are static HTML with real
content baked in at generation time. **This was a deliberate reversal of an
earlier same-day approach** that assembled this content client-side via
`topic-data.js` + `topic-page.js` + `site-nav.js` (a `<div id="topic-root">`
shell populated by JS after a `fetch("/posts.json")` resolved, and every
page's `<header>` replaced client-side on load). That approach shipped the
wrong nav in the actual HTML response, broke for no-JS/crawler visitors, and
contradicted the "no build step" rule above — it was tried, then explicitly
rejected in favor of baking everything statically, matching repo convention.

**Do not reintroduce `site-nav.js`, `topic-data.js`, or `topic-page.js`, or
any pattern where page content/nav only exists after a client-side script
runs.** If you need to add a subcategory, change nav-group items, or touch
the icon-dropdown/pcb-panel/topic-card-grid/destination-card markup, use
`_build/gen.py` (gitignored — local generator only, never shipped) as the
pattern: it bakes the same visual design directly into each page's HTML.
Any agent (Claude, ChatGPT, Codex) picking up frontend work here should
regenerate/re-run that pattern rather than hand-editing 14+ pages, and
should confirm it's working from current `preview` HEAD before starting —
this repo has already had one collision between agents working from stale
local state (2026-08-29 reconciliation) and a second one was narrowly
avoided by catching a queued redesign pass before it ran against a stale
branch. Check `git log -1 origin/preview` and read this file fresh before
any non-trivial change here.

`site-enhance.js` still exists but now contains only the one genuinely
runtime behavior left (the homepage carousel's scroll-driven accent color)
— not content rendering. Loaded only on `index.html`.

---

## Pipeline Publication Contract

When the pipeline publishes a Notion record, it creates or updates:

```text
_posts/YYYY-MM-DD-slug.html
posts.json
```

Each generated post uses `blog-post-template.html` as the canonical
shell. `article-template..html.html` (legacy — filename typo is known
and unfixed, flagged for a future cleanup pass) is kept aligned to the
same layout for compatibility; new automation should target
`blog-post-template.html`.

Article template fields:

```text
TITLE, META_DESCRIPTION, SLUG, IMAGE, IMAGE_ALT, IMAGE_CAPTION,
CATEGORY, CATEGORY_SLUG, SUBCATEGORY, TAGS, DATE, UPDATED_DATE,
DISPLAY_DATE, READ_TIME, AUTHOR, DEK, TLDR, BODY_HTML,
INLINE_IMAGE, INLINE_IMAGE_ALT, INLINE_IMAGE_CAPTION,
BODY_CONTINUED_HTML, CATEGORY_DESCRIPTION, RELATED_ARTICLES
```

Template rules:

- `CATEGORY_SLUG` is `technology`, `entertainment`, or `productivity`.
- `IMAGE` drives the hero image, Open Graph image, Twitter card image,
  and schema image.
- Omit the inline figure block if there's no second artwork piece.
- `RELATED_ARTICLES` renders `.post-card` links, same-category first
  when possible.
- Keep article copy editorial and readable — no dashboard/pipeline
  language.

`posts.json` entry shape:

```json
{
  "title": "Post Title",
  "slug": "YYYY-MM-DD-slug",
  "date": "YYYY-MM-DD",
  "category": "Technology",
  "subcategory": "AI Tools",
  "readTime": "4 min read",
  "excerpt": "Brief description...",
  "thumbnail": "https://www.techfusionreport.com/graphics/example_800x320.webp",
  "image": "https://www.techfusionreport.com/graphics/example_800x320.webp",
  "url": "/_posts/YYYY-MM-DD-slug.html",
  "feature": false
}
```

Rules:

- Notion is the durable editorial source of truth.
- GitHub is the publication record and delivery source.
- `posts.json` is the frontend index for homepage/category/blog surfaces.
- `category` must be exactly `Technology`, `Entertainment`, or
  `Productivity`.
- Dates stay ISO `YYYY-MM-DD`.
- Keep both `thumbnail` (compatibility) and `image` (current frontend).
- Never hardcode secrets or API keys — this repo is public.

---

## Key Files

```text
index.html                  — Homepage
blog.html                   — Category hub / blog entry
technology.html             — Technology category page
entertainment.html          — Entertainment category page
productivity.html           — Productivity category page
blog-post-template.html     — Canonical pipeline article template
article-template..html.html — Legacy template, kept aligned for compatibility
style.css                   — Global stylesheet
posts.json                  — Blog post index consumed by frontend + pipeline
_posts/                     — Individual post HTML files
graphics/                   — Brand assets
ops/                        — TechFusion OS — see "Two Surfaces, One Repo"
docs/techfusion-os*.md      — /ops/ implementation-boundary docs
CNAME                       — GitHub Pages custom domain
```

---

## Branch Rules — MANDATORY

- All AI-agent changes (Claude Code, Codex, anything else) go to
  `preview`. One branch, all tasks.
- Never push directly to `main`, under any circumstances.
- Never create additional branches without being asked.
- Human reviews `preview`, decides when to merge to `main`.
- `main` is production. Deployment triggers on merge — see the Stack
  Overview note on the unconfirmed delivery path.

---

🚧 Claude Cowork Cloud Sessions — GitHub Write Limitation (confirmed 2026-09-05)

Claude running inside Cowork (Anthropic's cloud/desktop-linked sessions — distinct from Claude Code running locally on the tfr server) writes to GitHub through a session-side git proxy with its own per-session authorized repository set. This is separate from the connected GitHub account's actual token scopes, which already have full read/write admin on this org (verified via get_me + repo permissions).

If a repo isn't on that session's proxy allowlist, every write call 403s with something like:

access denied by the git proxy: <owner>/<repo> is not in this session's authorized repository set,
so the proxy will not inject a credential for it. To fix, add the repository to the session's sources.

Confirmed affected: both Website and Automations. Confirmed not limited to git push — create_branch and add_issue_comment (PR comments) via the GitHub MCP tool 403 the same way. Reads (get_file_contents, search_code, list_*, etc.) are unaffected and work normally.

The proxy's own error message points at an add_repo mechanism to fix this — that mechanism does not currently exist in the Cowork UI or sandbox (tracked upstream: anthropics/claude-code#76248). There is no known user-side fix as of this writing.

What this means in practice: a Cowork session cannot assume it can push, branch, or comment on this repo just because the GitHub connector shows as connected with full permissions. If a write 403s with the message above, don't retry it or hunt for a workaround — hand Justin ready-to-apply file content / patch text / PR body copy instead, same as if there were no GitHub write access at all. Claude Code running locally on the tfr server is a separate execution path and is not known to be affected by this proxy limitation.

---

## Design System

- Cyan `#33C0F6`, Lime `#B8DA14`, White `#FFFFFF`, Dark `#0A0C10` —
  **final**, sampled directly from the logo file on 2026-08-26
  (supersedes the `#00D4FF`/`#A4FF00` values previously documented here
  — those are stale, don't reintroduce them). Do not propose alternate
  values.
- Body/UI font: DM Sans.
- Display font: **Delcom** — decided, and scoped narrowly to titles,
  section headings, and elements immediately adjacent to them, not a
  full display-font role. Delcom is a paid commercial font and is **not
  yet licensed/embedded** in the live CSS — `style.css` currently falls
  back to Rajdhani for that role. That's an implementation gap, not an
  open design decision — don't re-propose keeping Rajdhani as final.
- Cards use 8px radius unless an existing component requires otherwise.
- Match existing page structure before adding new elements. Check
  `style.css` for existing classes before writing new CSS.
- Keep the public experience editorial, not operational.

---

## Scope Boundaries

| Not This Repo | This Repo |
|---|---|
| Cloudflare Worker code / pipeline logic | Static HTML/CSS/JS for the public site |
| Notion database management | `/ops/` frontend (backend lives in Automations) |
| `/ops/api/*`, auth validation, automation controls | Published post files and the post index |
| Docker / homelab services | Brand assets and the design system |
| Secrets and API keys | — never store them here, this repo is public |

---

## Notion Logging — MANDATORY

- **TFR Task Tracker** (`30e1920a-4e2e-4dfc-8715-77aedd2115f8`) — update
  status when tasks start, complete, or block.
- **Dev Log** (`313bd080-de92-8159-bcee-c3fc4ed83462`) — dated entry
  after material site changes: what was done, what failed, how it was
  fixed, what's next.
- **This file** — update in the same commit as any change that affects
  the stack, branch rules, design system, or the two-surfaces split.
  Don't let it go stale — it already did once.
- Do not create a second source of truth for content or workflow state.
  Cross-system architecture/ownership lives in Notion, not in repo docs.

---

## Open Items (as of 2026-08-23)

- Confirm the actual production delivery path (GitHub Pages vs.
  Cloudflare Worker `website`) — see Stack Overview.
- `article-template..html.html` filename typo — known, unfixed, flagged
  for a future cleanup pass.
- PR #19 (this redesign, `preview` → `main`) pending merge.
