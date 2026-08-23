# CLAUDE.md — TechFusion Report Website

This file provides persistent context for Claude Code and Codex sessions in this repository. Read this before taking any action in the codebase.

---

## Project Identity

TechFusion Report is a professional publication at `techfusionreport.com` covering **Technology**, **Entertainment**, and **Productivity**. Public site decisions should favor production stability, editorial clarity, design quality, and pipeline compatibility.

---

## Stack Overview

- **Hosting:** GitHub Pages static site
- **Domain:** `techfusionreport.com` / `www.techfusionreport.com` through Cloudflare DNS to GitHub Pages
- **Deployment:** human-reviewed merge from `preview` to `main`; GitHub Pages deploys `main`
- **Build tooling:** none for this repo; pure HTML/CSS/JS only
- **Pipeline owner:** Cloudflare Workers in the Automations repo, not this repo
- **Editorial source of truth:** Notion `Content Catalog v2`
- **Published files:** GitHub `_posts/*.html` plus `posts.json`

---

## Current Frontend Direction

As of 2026-08-23, the `preview` branch contains the replacement public-facing blog frontend:

- Homepage: large animated TechFusion Report logo hero, simplified first viewport, latest-9 horizontal carousel.
- Blog page: category hub for Technology, Entertainment, and Productivity.
- Category pages: `technology.html`, `entertainment.html`, `productivity.html`, each showing only relevant section articles.
- Articles: static HTML files in `_posts/YYYY-MM-DD-slug.html`.
- Shared styles: `style.css` using Rajdhani, DM Sans, cyan `#00D4FF`, lime `#A4FF00`, white, and dark `#0A0C10`.
- Brand artwork uses existing files under `/graphics/` or canonical `https://www.techfusionreport.com/graphics/...` URLs.

Do not replace this with a command-center/dashboard UI. The public site is a reader-facing blog.

---

## Pipeline Publication Contract

When the pipeline publishes a Notion record, it should create or update:

```text
_posts/YYYY-MM-DD-slug.html
posts.json
```

Each `posts.json` entry should keep this shape:

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

- Notion remains the durable editorial source of truth.
- GitHub is the publication record and delivery source.
- `posts.json` is the frontend index for homepage/category/blog surfaces.
- Category values should be exactly `Technology`, `Entertainment`, or `Productivity` unless the frontend taxonomy is intentionally changed.
- Keep dates as ISO `YYYY-MM-DD` for sorting.
- Use `thumbnail` for backward compatibility and `image` for the new frontend.
- Do not hardcode secrets or API keys in this public repo.

---

## Key Files

```text
index.html                  — Homepage
blog.html                   — Category hub / blog entry
technology.html             — Technology category page
entertainment.html          — Entertainment category page
productivity.html           — Productivity category page
style.css                   — Global stylesheet
posts.json                  — Blog post index consumed by frontend/pipeline
_posts/                     — Individual post HTML files
graphics/                   — Brand assets
CNAME                       — GitHub Pages custom domain
```

---

## Branch Rules

- All Codex and design changes go to `preview`.
- Never push directly to `main`.
- Human reviews `preview`, then merges to `main` when ready.
- `main` auto-deploys to `techfusionreport.com` through GitHub Pages.

---

## Design System

- Primary cyan: `#00D4FF`
- Accent lime: `#A4FF00`
- White: `#FFFFFF`
- Dark: `#0A0C10`
- Display font: Rajdhani
- Body font: DM Sans
- Cards use 8px radius unless an existing component requires otherwise.
- Keep the public experience editorial, not operational.

---

## Scope Boundaries

| Not This Repo | This Repo |
|---|---|
| Cloudflare Workers / agents | Static HTML/CSS/JS for public site |
| Notion database management | Published post files and post index |
| Ops dashboard backend | Public blog/category/article surfaces |
| Secrets and API keys | Brand assets and presentation layer |

---

## Notion Logging

When possible, update the TFR Task Tracker and Dev Log after material site changes. Do not create a second source of truth for content or workflow state.
