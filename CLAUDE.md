# CLAUDE.md — TechFusion Report Website

This file provides persistent context for Claude Code sessions in this repository.
Read this before taking any action in the codebase.

---

## 🗣️ Terminology & Shorthand

| What Justin Says | What It Means |
|---|---|
| **the site** / **the website** | techfusionreport.com — GitHub Pages static site (this repo) |
| **the blog** | The blog listing page (`blog.html`) and individual post pages |
| **posts** | HTML files in `_posts/YYYY-MM-DD-slug.html` |
| **posts.json** | The JSON index file the homepage reads to auto-populate blog previews |
| **the homepage** | `index.html` — the main landing page |
| **category pages** | `/technology/`, `/entertainment/`, `/productivity/` — Phase 2 |
| **the pipeline** | The Cloudflare Workers automation backend in the Automations repo — NOT this repo |
| **deploy it** | Commit to main → GitHub Pages auto-deploys. No build step needed. |
| **brand assets** | Images hosted at `https://techfusionreport.github.io/graphics/` |
| **task tracker** | 📋 Master Task Tracker database in TechFusion OS — https://www.notion.so/techfusionreport/9a75e952ff6140c786a1e364ce60eea6?v=31cbd080de9280cba772000c3ac26b91 |
| **dev log** | 🛠️ Blog Automation Dev Log in Notion (`313bd080-de92-8159-bcee-c3fc4ed83462`) |

---

## 🏢 Project Identity

**TechFusion Report (TFR)** is a professional tech-focused publication at `techfusionreport.com`.
It covers three content verticals: **Technology**, **Entertainment**, and **Productivity**.

This is a **business project** — not a personal or homelab experiment. All decisions here
should reflect production stability, design quality, and publication professionalism.

---

## 🏗️ Stack Overview

- **Command center:** ⚡ TechFusion OS in Notion (`31cbd080-de92-81e3-aa4c-d1aed5a4c05a`)
- **Hosting:** GitHub Pages (static, no server-side rendering)
- **Domain:** techfusionreport.com (Cloudflare DNS → GitHub Pages)
- **Deployment:** Push to `main` branch → auto-deploys within ~1 minute
- **No build step** — pure HTML/CSS/JS, no Node.js, no bundler

### GitHub Structure
**TechFusionReport org** = TFR business only. All repos are peers — no hierarchy:
- `Website` — GitHub Pages frontend (this repo)
- `Automations` — Cloudflare Workers backend, agents, pipeline logic
- `Master` — reference/docs
- `DiscordBot` — Discord integration

**Personal account (`jmsmith1003`)** = homelab scripts, personal projects, experiments. Nothing personal belongs in the TechFusionReport org.

### Key Files
```
index.html                  — Homepage (auto-populates from posts.json)
blog.html                   — Blog listing page with category filters
blog-post-template.html     — Individual post template
style.css                   — Global stylesheet
blog-post.css               — Post-specific styles
posts.json                  — Blog post index (homepage reads this)
_posts/                     — Individual blog post HTML files (YYYY-MM-DD-slug.html)
graphics/                   — Brand assets (logo, category images)
```

### Brand & Design System
- **Primary color:** Cyan `#00D4FF`
- **Accent color:** Lime `#A4FF00`
- **Background:** Dark theme
- **Fonts:** Rajdhani (headlines) + DM Sans (body)
- **Logo:** `https://techfusionreport.github.io/graphics/tfr_header_logo_nb.png`
- **Category graphics:**
  - Tech: `tech_nb.png`
  - Entertainment: `ent_nb.png`
  - Productivity: `prod_nb.png`

### Homepage Features (live)
- Editorial hero with `TFR-Hero-Background.png` at 25% opacity + scanline overlay
- News ticker
- Stats strip
- Magazine-style category cards with accent bars
- Featured/sidebar blog post layout (auto-populates from `posts.json`)
- Two-column newsletter section
- Publication footer

---

## 🚀 Deployment Rules

- **Always commit to `main`** — GitHub Pages serves from main branch
- **No wrangler, no npm, no build commands** — this is a static site
- **Test HTML/CSS changes** by previewing locally before committing if possible
- **Update `posts.json`** whenever a new post is added to `_posts/` — the homepage
  will not show the new post otherwise
- **Never hardcode API keys or secrets** — this repo is public

### Post File Format
New posts go in `_posts/` as:
```
YYYY-MM-DD-slug.html
```
And a corresponding entry must be added to `posts.json`:
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

## 📓 Notion Logging — MANDATORY (no prompting needed)

**TFR Task Tracker** — update TFR task status whenever something starts, completes, blocks, or is discovered.
URL: https://www.notion.so/techfusionreport/9a75e952ff6140c786a1e364ce60eea6?v=31cbd080de9280cba772000c3ac26b91

**Dev Log** — add a dated session entry after every session. What was done, what failed, how it was fixed, what's next. Update the Known Issues table (`## 🐛 Known Issues`) in the same pass.
Page ID: `313bd080-de92-8159-bcee-c3fc4ed83462`

**CLAUDE.md** — update in the same commit as any site change. Never let it go stale.

---

## 🏠 Scope Boundaries — Website vs. Homelab

### Server User Structure
This repo is worked on as the `tfr` user on TFR-Prod. Personal homelab work
(Docker, n8n, Vaultwarden) belongs to the `justin` user and a separate directory.

| ❌ Not This Repo | ✅ This Repo |
|---|---|
| Cloudflare Workers / agents | HTML/CSS/JS for techfusionreport.com |
| Notion database management | Blog post files and post index |
| Docker / homelab services | Brand assets and design system |
| Personal n8n experiments | Category pages (Phase 2) |

The homelab has its own CLAUDE.md. If Justin switches to homelab work,
he will launch Claude Code from `~/homelab/` instead.

---

## ⚠️ Known Open Issues (as of 2026-03-28)
- `blog.html` index auto-population~~ ✅ Fixed 2026-03-29
- Category pages (`/technology/`, `/entertainment/`, `/productivity/`) not yet built (Phase 2)
- `posts.json` may not reflect all published posts — verify before adding new entries

---

## 🎯 Current Priority Order
1. ~~Fix `blog.html` index auto-population~~ ✅ Done
2. Keep `posts.json` updated as new posts publish — homepage depends on it
3. Phase 2: Build category pages for Technology, Entertainment, Productivity
4. Phase 3: Google Analytics, affiliate links, AdSense groundwork
