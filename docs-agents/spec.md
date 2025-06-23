# Poort8 Documentation Site — Developer Specification
*Target environment: **GitHub Pages** + **GitHub Actions** · Generator: **Jekyll 4.x** with **Minima 3.x***

---

## 1 · Project Goals & Scope

| Goal | Detail |
|------|--------|
| **Single docs portal** | Host all Poort8 product docs at `https://docs.poort8.nl/`. |
| **Multi-product structure** | Products: **HeyWim · Keyper · Noodlebar**.<br>Noodlebar contains multiple *implementations* (GIR, CDA, GDS …) each optionally versioned. |
| **Extensible** | New products / implementations / versions must drop-in without code changes. |
| **Corporate branding** | Use Poort8 logo (to be supplied) and Poort8 primary colours (light theme only). |
| **Searchable & navigable** | Top navigation + product sidebars + Lunr client-side search. |
| **Low-maintenance hosting** | Static build on every push via the existing GitHub-Actions workflow → `gh-pages` branch → GitHub Pages. |

---

## 2 · High-Level Architecture

repo (main)
├─ _config.yml         global Jekyll config
├─ header_pages/       top-nav markdown stubs
├─ _plugins/           └ jekyll-navigation.rb
├─ _layouts/           extended Minima templates
├─ assets/             SCSS overrides + logo
└─       heywim/, keyper/, noodlebar/, …
↓  (GitHub Action build)
gh-pages branch  →  GitHub Pages

| Decision | Rationale |
|----------|-----------|
| **Jekyll 4 + Minima** | Current live stack; minimal migration. |
| **`jekyll-navigation`** | Auto-generates Markdown-driven sidebars. |
| **`jekyll-lunr-js-search`** | Pure client-side search, no external service. |
| **External Scalar links** | Avoids iframe styling hassles. |
| **GitHub Actions ⇢ `gh-pages`** | Workflow already in place. |

---

## 3 · Information Architecture & File Layout

### 3.1 Top Navigation (`_config.yml`)

```yaml
header_pages:
  - index.md            # Home – “Poort8 Docs”
  - guide.md            # Product Guide
  - heywim/index.md
  - keyper/index.md
  - noodlebar/index.md
  - status.md           # optional API status

3.2 Per-Product Skeletons

heywim/
  index.md
  quick-start.md
  sources.md
  datamodel.md
  webhooks.md
  api-link.md          # external Scalar URL
  examples.md
  faq.md

keyper/
  index.md
  quick-start.md
  user-flows.md
  use-cases.md
  api-link.md
  faq.md

noodlebar/
  index.md
  quick-start.md
  implementations/
    gir/
      context.md       # nav_order:1
      auth.md
      endpoints.md
      examples.md
      api-link.md
      faq.md
    cda/
      context.md
      …
    gds/
      context.md
      …

Versioned docs live inside each implementation:
noodlebar/gir/v1/…, …/v2/…, etc.

3.3 Sidebar Ordering

Each Markdown file contains:

---
title: "Context & Rollen"
nav_order: 1
---

jekyll-navigation uses nav_order to build sidebars.

⸻

4 · Styling & Theming

Item	Implementation
Logo	assets/images/poort8-logo.svg (placeholder until supplied).
Colours	Override Minima CSS vars in assets/css/custom.scss (--brand-primary, etc.).
Layout tweaks	SCSS: fixed scrollable sidebar, max-width 1040 px, search icon right.
Dark-mode	Not in scope (light-theme only).


⸻

5 · Content Conventions
	•	Markdown with YAML front-matter.
	•	Optimised images ≤ 150 kB (SVG preferred).
	•	External API docs open in a new tab (target="_blank" rel="noopener").
	•	Front-matter keys: title, nav_order, has_children.

⸻

6 · Error Handling & Build Safeguards

Layer	Strategy
404	Custom 404.html with search field + link back to Guide.
Broken links	htmlproofer in CI – build fails on 4xx internal links.
Search index	Build fails if Lunr index generation errors.


⸻

7 · GitHub Actions Workflow (existing)
	1.	setup-ruby → bundle install
	2.	jekyll build --trace
	3.	htmlproofer _site
	4.	Force-push _site → gh-pages

	•	GitHub Pages sources gh-pages root /.
	•	CNAME : docs.domain-box.portacht.ml.

⸻

8 · Testing Plan

Phase	Verify	How
Build	No link errors & Lunr index present	CI workflow.
Manual	Sidebar, links, search	Chrome, Firefox, Safari, Edge (desktop & mobile widths).
Performance	FCP < 1.5 s	Lighthouse (manual or CI).
Accessibility	Contrast & keyboard nav	Axe extension.


⸻

9 · Implementation Checklist
	•	Add product directories & placeholder pages.
	•	Add jekyll-navigation & jekyll-lunr-js-search to Gemfile.
	•	Place logo SVG & define brand colours in custom.scss.
	•	Update _config.yml header_pages.
	•	Ensure every page has nav_order.
	•	Verify workflow passes; check CNAME.
	•	Replace logo / colours when final assets arrive.

⸻

10 · Future Enhancements (out of scope)
	•	Dark-mode toggle.
	•	Algolia DocSearch.
	•	Screenshot regression tests (Percy).
	•	Interactive MDX-style samples (would require Docusaurus).

⸻

Ready for development.
Clone → bundle install → follow checklist → push to main → CI publishes.

