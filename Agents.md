# Agents.md — TechFusion Report Website

This file provides persistent context for Codex sessions in this repository.
Read this before taking any action in the codebase.

Always commit and push changes to the `preview` branch only. Never push directly to `main`.
---

## 🗣️ Terminology & Shorthand

| What Justin Says | What It Means |
|---|---|
| **the site / the website** | techfusionreport.com — GitHub Pages static site (this repo) |
| **the blog** | `blog.html` and individual post pages |
| **posts** | HTML files in `_posts/YYYY-MM-DD-slug.html` |
| **posts.json** | JSON index the homepage reads to auto-populate blog previews |
| **the homepage** | `index.html` |
| **category pages** | `/technology/`, `/entertainment/`, `/productivity/` — Phase 2 |
| **the pipeline** | Cloudflare Workers backend in the Automations repo — NOT this repo |
| **deploy it** | Commit to main → GitHub Pages auto-deploys. No build step. |
| **brand assets** | Images at `https://techfusionreport.github.io/graphics/` |
| **task tracker** | ⚡ TFR Task Tracker (`30e1920a-4e2e-4dfc-8715-77aedd2115f8`) |
| **dev log** | 🛠️ Blog Automation Dev Log (`313bd080-de92-8159-bcee-c3fc4ed83462`) |

---

## 🏢 Project Identity

TechFusion Report is a professional tech publication at `techfusionreport.com` covering **Technology**, **Entertainment**, and **Productivity**. This is a business project — all decisions should reflect production stability, design quality, and publication professionalism.

---

## 🏗️ Stack Overview

- **Hosting:** GitHub Pages (static, no SSR)
- **Domain:** techfusionreport.com (Cloudflare DNS → GitHub Pages)
- **Deployment:** Push to `main` → auto-deploys in ~1 min
- **No build step** — pure HTML/CSS/JS, no Node.js, no bundler

### Key Files
```
index.html                  — Homepage (auto-populates from posts.json)
blog.html                   — Blog listing page with category filters
blog-post-template.html     — Individual post template
style.css                   — Global stylesheet
blog-post.css               — Post-specific styles
posts.json                  — Blog post index
_posts/                     — Individual post HTML files (YYYY-MM-DD-slug.html)
graphics/                   — Brand assets
```

### Brand & Design System

| Property | Value |
|---|---|
| Primary | Cyan `#00D4FF` |
| Accent | Lime `#A4FF00` |
| Background | Dark `#0A0C10` |
| Display font | Rajdhani |
| Body font | DM Sans |
| Logo | `https://techfusionreport.github.io/graphics/tfr_header_logo_nb.png` |
| Category images | `tech_nb.png`, `ent_nb.png`, `prod_nb.png` |

### Homepage Features (live)
- Editorial hero — `TFR-Hero-Background.png` at 25% opacity + scanline overlay
- News ticker, stats strip, magazine-style category cards
- Featured/sidebar blog layout (auto-populates from `posts.json`)
- Two-column newsletter section, publication footer

---

## 🚀 Deployment Rules

- Always commit to `main` — GitHub Pages serves from main
- No wrangler, no npm, no build commands
- Update `posts.json` whenever a new post is added to `_posts/`
- Never hardcode API keys — this repo is public

### Branch Strategy
- `main` — production. Every push auto-deploys to techfusionreport.com.
- `preview` — staging branch. All Codex and design changes go here first.

### Post File Format
```
_posts/YYYY-MM-DD-slug.html
```

Corresponding `posts.json` entry:
```json
{
  "title": "Post Title",
  "slug": "YYYY-MM-DD-slug",
  "date": "YYYY-MM-DD",
  "category": "Technology",
  "excerpt": "Brief description...",
  "thumbnail": "optional-image-url"
}
```

---

## 🤖 Codex Agent — Rules & Known Walls

Codex operates in a sandboxed cloud environment. These rules are non-negotiable.

**What Codex CAN do in this repo:**
- Read and edit all HTML, CSS, and JS files
- Build new category pages and subcategory pages
- Create GitHub Actions workflows (e.g. SVG → PNG conversion)
- Fix layout bugs, update brand colors, add analytics tags
- Add new posts to `_posts/` and update `posts.json`
- Update `blog-post-template.html` and `style.css`

**What Codex CANNOT do — hard walls:**
- Push directly to `main` — all changes must go to `preview` branch
- Deploy or trigger GitHub Pages — human merges preview → main
- Access any live service, API, or external URL during build
- Use Node.js, npm, or any build tooling — pure HTML/CSS/JS only, no bundler
- Hardcode API keys — this repo is public

**Branch rules for Codex — MANDATORY:**
- ALL changes go to `preview` branch — one branch, all tasks
- Never push to `main` under any circumstances
- Never create additional branches
- Human reviews preview and decides when to push to main
- Main auto-deploys to techfusionreport.com within ~1 min of merge

**Design system — never deviate:**
- Cyan `#00D4FF`, Lime `#A4FF00`, Dark `#0A0C10`
- Fonts: Rajdhani (headlines), DM Sans (body)
- Match existing page structure exactly before adding new elements
- Check `style.css` for existing classes before writing any new CSS

---

## ⚠️ Known Open Issues (as of 2026-05-14)

- Category pages not yet built (Phase 2)
- Keep `posts.json` updated as new posts publish — homepage depends on it
- GA4 analytics tag not yet added to templates
- SVG → PNG GitHub Actions workflow not yet built

---

## 🏠 Scope Boundaries

| ❌ Not This Repo | ✅ This Repo |
|---|---|
| Cloudflare Workers / agents | HTML/CSS/JS for techfusionreport.com |
| Notion database management | Blog post files and post index |
| Docker / homelab services | Brand assets and design system |
| Personal n8n experiments | Category pages (Phase 2) |

---

## 📓 Notion Logging — MANDATORY

**TFR Task Tracker** — update status when tasks start, complete, or block.
**Dev Log** — dated entry after every session. What was done, what failed, how fixed, what's next.
**CLAUDE.md** — update in the same commit as any site change. Never let it go stale.

---

## 🎯 Current Priority Order (as of 2026-05-14)

1. ~~Fix `blog.html` index auto-population~~ ✅ Done
2. Keep `posts.json` updated as new posts publish
3. Build SVG → PNG GitHub Actions workflow
4. Wire GA4 tag into `index.html` and `blog-post-template.html`
5. Phase 2: Build category pages (Technology, Entertainment, Productivity)
6. Phase 3: Affiliate links, AdSense groundwork
7. Phase 3: Add media kit page
