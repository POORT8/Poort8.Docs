# Poort8 Documentation Portal – Complete Implementation Blueprint

## 1 · Macro Blueprint

| # | Macro Step | Purpose |
|---|------------|---------|
| 1 | **Repo bootstrap** | Init repo, pin Ruby, Gemfile, minimal Jekyll. |
| 2 | **Skeleton IA** | Header pages + empty product/implementation dirs. |
| 3 | **✱ Core content drafting** | *Write all docs interactively — D-series.* |
| 4 | **Navigation & search** | Sidebar (jekyll-navigation) + Lunr search. |
| 5 | **Branding** | Poort8 logo & brand colours. |
| 6 | **CI build & deploy** | GitHub Actions, html-proofer, `gh-pages`, CNAME. |
| 7 | **Quality gates & housekeeping** | Lighthouse, markdown-lint, CONTRIBUTING. |

---

## 2 · Milestones

| Milestone | Builds On | Deliverables |
|-----------|-----------|--------------|
| **M0 — Foundation** | – | repo bootstrap |
| **M1 — Skeleton IA** | M0 | empty docs structure |
| **M2 — Content Drafting** | M1 | *all pages populated* |
| **M3 — Navigation & Search** | M2 | sidebar + Lunr |
| **M4 — Brand & UX Polish** | M3 | logo, colours |
| **M5 — CI & Delivery** | M4 | build + deploy |
| **M6 — Quality Gates** | M5 | Lighthouse, lint, CONTRIBUTING |

---

## 3 · Atomic Steps & Tests

### **M0 — Foundation**

| S-ID | Description | Acceptance / Tests |
|------|-------------|--------------------|
| S0-1 | `git init`, add **LICENCE** (MIT, 2025 Poort8 BV), `.editorconfig`, `.gitignore`. | Repo clean (`git status` shows no untracked files). |
| S0-2 | Add `.ruby-version` `3.3.0`. | `ruby -v | grep 3.3.0` returns non-empty. |
| S0-3 | **Gemfile**: Jekyll 4.3.x, Minima 3.x. Run `bundle lock --add-platform x86_64-linux`. | `bundle install --jobs 4` exits 0. |
| S0-4 | Minimal `_config.yml` (title, url, theme, empty plugins). | `bundle exec jekyll build` succeeds; `_site/index.html` exists. |

### **M1 — Skeleton IA**

| S-ID | Description | Tests |
|------|-------------|-------|
| S1-1 | Add `index.md` (“Poort8 Docs”) & `guide.md`; update `header_pages` in `_config.yml`. | `grep -R "Poort8 Docs" _site` non-empty. |
| S1-2 | Create dirs **heywim**, **keyper**, **noodlebar** + their `index.md` (title, nav_order 1). | `_site/heywim/index.html` etc. exist. |
| S1-3 | Add placeholder pages (`quick-start.md`, `faq.md`, etc.) for each product; each with `nav_order: 10`. | `bundle exec htmlproofer ./_site --disable-external` passes. |

### **M2 — Content Drafting**  *(interactive D-series below)*

| D-ID | Description | Tests |
|------|-------------|-------|
| D0 | Create **docs-todo.md** checklist of every Markdown page. | File exists; list length == page count. |
| D1 | Ask user and commit **home-page** copy. | Build passes. |
| D2 | Ask user and commit **guide outline**. | Build passes. |
| D3 | Ask user & commit **quick-start** for each product. | html-proofer passes. |
| D4 | Ask user & commit **context** for each implementation. | markdown-lint passes. |
| D5 | Ask user & commit **API link URLs** for each product / impl. | html-proofer passes. |
| D6 | Loop until all check-boxes ticked; commit milestone. | 0 unchecked boxes in docs-todo.md. |

### **M3 — Navigation & Search**

| S-ID | Description | Tests |
|------|-------------|-------|
| S2-1 | Add **jekyll-navigation**: Gemfile, `_plugins/jekyll-navigation.rb`, enable in config, add `has_children: true` to section indexes. | Sidebar appears locally; no warnings. |
| S2-2 | Add **jekyll-lunr-js-search**: Gemfile, enable plugin, create `search.json` template, add `/assets/js/search.js`, insert search box into header. | `_site/search.json` size > 100 B. |
| S2-3 | Add **Capybara/RSpec** integration spec (`spec/search_spec.rb`) to verify “HeyWim” query returns ≥ 1 result. | `bundle exec rspec` green. |

### **M4 — Brand & UX Polish**

| S-ID | Description | Tests |
|------|-------------|-------|
| S3-1 | Add placeholder `assets/images/poort8-logo.svg`, swap in header. | `grep -R "poort8-logo.svg" _site | wc -l` ≥ 1. |
| S3-2 | Create `assets/css/custom.scss`; override colour vars (`$brand-primary: #0064FF`, etc.) and `@import "minima";`. | `grep -R "#0064FF" _site/assets | wc -l` > 0. |
| S3-3 | Make sidebar fixed & scrollable via SCSS (`.side-bar{position:fixed;top:0;bottom:0;overflow-y:auto;}`). | Manual verify / screenshot. |

### **M5 — CI & Delivery**

| S-ID | Description | Tests |
|------|-------------|-------|
| S4-1 | Add **GitHub Actions** build workflow `.github/workflows/ci.yml`: checkout → ruby/setup-ruby → bundle → `jekyll build` → `htmlproofer`. | CI green on PR. |
| S4-2 | Extend CI with **deploy job** (`peaceiris/actions-gh-pages`) on push to main. | `gh-pages` branch updated. |
| S4-3 | Add **CNAME** file (`docs.domain-box.portacht.ml`). | `_site/CNAME` exists after build. |

### **M6 — Quality Gates**

| S-ID | Description | Tests |
|------|-------------|-------|
| S5-1 | Add **Lighthouse CI** daily + on push, budget FCP ≤ 1500 ms (`.lighthouse-budget.json`). | Lighthouse action passes. |
| S5-2 | Add **markdown-lint** config + CI step. | CI remains green. |
| S5-3 | Add **CONTRIBUTING.md** (nav_order rules, build / test / add-page instructions). | markdown-lint passes. |

---

# Code-Generation LLM Prompts

**Usage order**

1. **Prompt 0** – shared context (once).  
2. **D0 → D6** – interactive content.  
3. **S0-1 → S5-3** – build, UX, CI, quality.

---

## Prompt 0 – Shared Context

```text
You are an AI pair-programmer working in a GitHub repository for Poort8’s public docs portal.

Constraints
-----------
* Language: Ruby 3.3.0
* Site generator: Jekyll 4.3.3 + Minima 3
* All commands must be idempotent.
* After every change the site **must** pass:
    bundle exec jekyll build
    bundle exec htmlproofer ./_site --disable-external
* Return **only** a unified diff or new / modified file contents. No commentary.
```

---

## D-Series – Content Drafting Prompts

### Prompt D0 – Create docs-todo.md

```text
Task: Kick-off content drafting.

1. Scan the project for every Markdown file under the site root.
2. Create docs-todo.md in repo root. For each page add an unchecked box:
   - [ ] /heywim/quick-start.md — Quick start guide
3. Commit with message: “docs: create content to-do checklist”.
```

### Prompt D1 – Home-page copy

```text
Task: Gather and commit the home-page copy.

1. Ask the user:

   ===
   TOPIC: Why Poort8?

   COPY & PASTE INTO YOUR EXTERNAL DOCUMENT-DRAFTING LLM:

   You are **CopyBot**. Your job is to produce a concise yet complete markdown section for `index.md`.

   • Ask me **one focused question at a time** to collect the necessary info on the TOPIC above.  
   • When you have everything, output **FINAL MARKDOWN** (≤ 200 words) between  
     `<!-- BEGIN index.md -->` and `<!-- END index.md -->`.  
   • Two short paragraphs answering **“Why Poort8?”**; no extra commentary.

   Begin with your first question.
   ===

2. WAIT for user input.
3. Replace the placeholder body of `index.md` with the provided text (keep front-matter).
4. Tick the corresponding box in docs-todo.md.
5. Commit “docs: add home page content”.
6. Ensure `bundle exec jekyll build` remains green.
```

### Prompt D2 – Product-guide outline

```text
Task: Draft the Product-Guide outline.

1. Ask the user:

   ===
   TOPIC: Product Guide

   COPY & PASTE INTO YOUR EXTERNAL DOCUMENT-DRAFTING LLM:

   You are **CopyBot**. Goal: deliver a clean outline for `guide.md`.

   • Query me one question at a time about sections for the TOPIC above.  
   • When satisfied, output **FINAL MARKDOWN** (≤ 120 words) between  
     `<!-- BEGIN outline.md -->` and `<!-- END outline.md -->`, as a bullet hierarchy only.

   First question, please.
   ===

2. WAIT for input.
3. Insert the bullet list under an `## Overview` heading in `guide.md`.
4. Tick its box in docs-todo.md.
5. Commit “docs: initial guide outline”.
```

### Prompt D3 – Quick-start guide (per product)
```text
Task: Draft quick-start guide.

INPUT: TARGET_PAGE (e.g. /heywim/quick-start.md) and PRODUCT name.

1. Ask the user:

   ===
   TOPIC: Quick-start for {PRODUCT} – {PRODUCT_DESC}

   COPY & PASTE INTO YOUR EXTERNAL DOCUMENT-DRAFTING LLM:

   You are **CopyBot**. Produce markdown for `/quick-start/{PRODUCT}.md`.

   • Ask me one question at a time about goal, prerequisites, and the 3–5-step happy path for the TOPIC.  
   • Return **FINAL MARKDOWN** (≤ 200 words) wrapped by  
     `<!-- BEGIN quick-start/{PRODUCT}.md -->` … `<!-- END -->`, using H2 “Goal”, “Prerequisites”, “Steps”.

   Ask your first question.
   ===

2. WAIT for input.
3. Replace body of TARGET_PAGE with an ordered list of those 5 steps.
4. Tick TARGET_PAGE in docs-todo.md.
5. Commit “docs: quick-start for <PRODUCT>”.
6. Verify html-proofer still passes.
```

### Prompt D4 – Implementation Context (repeat)

```text
Task: Capture implementation context.

INPUT: TARGET_PAGE (e.g. /noodlebar/gir/context.md) and IMPLEMENTATION name.
1. Ask the user:

   ===
   TOPIC: Implementation {IMPL_CODE} – {ONE-LINE SUMMARY}

   COPY & PASTE INTO YOUR EXTERNAL DOCUMENT-DRAFTING LLM:

   You are **CopyBot**. Deliver `/implementations/{IMPL_CODE}/context.md`.

   • Interrogate me one question at a time about background, objectives, key decisions, lessons learned for the TOPIC.  
   • Output **FINAL MARKDOWN** (≤ 250 words) between  
     `<!-- BEGIN context.md -->` … `<!-- END -->`, with H2 headings.

   Start with your first question.
   ===

2. WAIT; paste answer into TARGET_PAGE body.
3. Tick TARGET_PAGE in docs-todo.md.
4. Commit “docs: context for <IMPLEMENTATION>”.
```

### Prompt D5 – API Link

```text
Task: Fill an API link stub.

For each `api-link.md` that is empty:

1. Ask user:

   ===
   Paste the **public URL** for the external Scalar/API docs for <PRODUCT>/<IMPLEMENTATION>.
   ===

2. WAIT; replace body with:

   [Open full API reference](<URL>){:target="_blank" rel="noopener"}

3. Tick the entry in docs-todo.md.
4. Commit “docs: API link for <PRODUCT or IMPLEMENTATION>”.
```

### Prompt D6 – Finish Drafting

```text
Task: Finalise content milestone.

1. Inspect docs-todo.md.
2. If any boxes remain unchecked, repeat D3…D5 accordingly.
3. When all boxes are checked:
   • Option 1: delete docs-todo.md.
   • Option 2: leave it as a completed log.
4. Commit “docs: content drafting milestone complete”.
```

---

## S-Series – Build / UX / CI / Quality Prompts

*(Full original detail – one prompt per atomic step)*

### Prompt S0-1 – Repo Bootstrap

```text
Task: Initialise repository.

1. Run: git init
2. Add files:
   • LICENCE – MIT, copyright “© 2025 Poort8 BV”.
   • .editorconfig – root=true, UTF-8, LF ends, indent 2 spaces for yml/md.
   • .gitignore – macOS `.DS_Store`, Ruby `/vendor/bundle`, Jekyll `_site/`.
3. Commit: “chore: repo bootstrap”.

Test: git status shows clean workspace.
```

### Prompt S0-2 – Ruby Version

```text
Task: Pin Ruby.

1. Add .ruby-version with “3.3.0”.
2. Update README prerequisites section accordingly.
3. Commit: “chore: pin Ruby 3.3.0”.

Test: `ruby -v | grep 3.3.0` returns non-empty.
```

### Prompt S0-3 – Gemfile

```text
Task: Add Gemfile.

source "https://rubygems.org"
ruby  "3.3.0"

gem "jekyll", "~> 4.3"
gem "minima", "~> 3.0"

group :test do
  gem "rspec", "~> 3.12"
  gem "capybara", "~> 3.39"
  gem "webrick", "~> 1.8"
end

Run: bundle lock --add-platform x86_64-linux

Commit: “feat: Gemfile with Jekyll & Minima”.

Test: `bundle install --jobs 4 --retry 3` exits 0.
```

### Prompt S0-4 – Minimal _config.yml

```text
Task: Create minimal `_config.yml`.

title: "Poort8 Docs"
url:   "https://docs.domain-box.portacht.ml"
theme: minima
plugins: []

Commit: “feat: minimal _config.yml”.

Test: `bundle exec jekyll build` succeeds; `_site/index.html` generated.
```

### Prompt S1-1 – Core Pages & Top-Nav

```text
Task: Home & Guide pages.

1. Create index.md and guide.md with front-matter.

index.md front-matter:
---
title: "Poort8 Docs"
nav_order: 1
---

guide.md front-matter:
---
title: "Product Guide"
nav_order: 1
---

2. Update `_config.yml`:

header_pages:
  - index.md
  - guide.md

Commit: “feat: home & guide stubs”.

Test: Build then `grep -R "Poort8 Docs" _site` returns > 0.
```

### Prompt S1-2 – Product Skeletons

```text
Task: Product directories.

1. Create directories & index pages:

heywim/index.md
keyper/index.md
noodlebar/index.md

Each front-matter:

---
title: "<Product Name>"
nav_order: 1
has_children: true
---

Commit: “feat: product skeletons”.

Test: `_site/heywim/index.html` etc. exist.
```

### Prompt S1-3 – Placeholder Pages

```text
Task: Placeholder child pages.

For each product add:

* quick-start.md
* faq.md

Front-matter example:

---
title: "Quick Start"
nav_order: 10
---

Body: `## Work in progress`

Commit: “chore: placeholder child pages”.

Test: `bundle exec htmlproofer _site --disable-external` passes.
```

### Prompt S2-1 – jekyll-navigation

```text
Task: Add jekyll-navigation.

1. Append Gemfile: gem "jekyll-navigation", "~> 0.3"
2. Add `_plugins/jekyll-navigation.rb`:

require "jekyll-navigation"

3. Update `_config.yml`:

plugins:
  - jekyll-navigation

4. Ensure every directory index (`index.md`) has `has_children: true`.

Commit: “feat: sidebar navigation”.

Test: Build and verify sidebar HTML exists via `grep -R "site-navigation" _site | wc -l` ≥ 1.
```

### Prompt S2-2 – jekyll-lunr-js-search

```text
Task: Client-side search.

1. Append Gemfile: gem "jekyll-lunr-js-search", "~> 3.0"
2. Enable in `_config.yml` plugins.
3. Add `/assets/js/search.js` (initialises Lunr and renders results).
4. Create `_includes/search_input.html` with:

<input id="search-input" type="search" placeholder="Search…">
<ul id="results"></ul>

5. Insert `{% include search_input.html %}` into `_layouts/default.html` header.
6. Add template `search.json` as per plugin docs.

Commit: “feat: lunr search”.

Test: Build then `test -f _site/search.json` and `stat -c%s _site/search.json` > 100.
```

### Prompt S2-3 – Search Integration Spec

```text
Task: Integration test.

1. Add `spec/spec_helper.rb` standard RSpec config.
2. Add `spec/search_spec.rb`:

require "capybara/rspec"
Capybara.app = Rack::File.new(File.expand_path("../../_site", __FILE__))

describe "Search", type: :feature do
  it "returns results for HeyWim" do
    visit "/index.html"
    fill_in "search-input", with: "HeyWim"
    expect(page).to have_css "#results li a", minimum: 1
  end
end

3. Commit: “test: search returns results”.

Test: `bundle exec rspec` green.
```

### Prompt S3-1 – Logo

```text
Task: Branding – logo.

1. Add `assets/images/poort8-logo.svg` (200×40 placeholder).
2. In `_includes/header.html` replace site-title text with:

<img src="{{ '/assets/images/poort8-logo.svg' | relative_url }}" alt="Poort8 logo" height="40">

Commit: “feat: placeholder Poort8 logo”.

Test: `grep -R "poort8-logo.svg" _site | wc -l` ≥ 1.
```

### Prompt S3-2 – Colour Overrides

```text
Task: Branding – colours.

1. Create `assets/css/custom.scss`.

$brand-primary: #0064FF;
$body-heading-color: #003366;

@import "minima";

2. Reference it in `_config.yml`:

sass:
  style: compressed

Commit: “feat: brand colour overrides”.

Test: Build then `grep -R "#0064FF" _site/assets | wc -l` > 0.
```

### Prompt S3-3 – Scrollable Sidebar

```text
Task: Fixed scrollable sidebar.

Append to custom.scss:

.side-bar {
  position: fixed;
  top: 0;
  bottom: 0;
  overflow-y: auto;
}

Commit: “feat: fixed scrollable sidebar”.

Manual verification only.
```

### Prompt S4-1 – GitHub Actions Build

```text
Task: CI build workflow.

Add `.github/workflows/ci.yml`:

name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with: { ruby-version: '3.3' }
      - run: bundle install --jobs 4 --retry 3
      - run: bundle exec jekyll build --trace
      - run: bundle exec htmlproofer ./_site --disable-external

Commit: “ci: basic build job”.

Test: Push branch; workflow green.
```

### Prompt S4-2 – Deploy to gh-pages

```text
Task: Deploy job.

Append to ci.yml:

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with: { ruby-version: '3.3' }
      - run: bundle install --jobs 4 --retry 3
      - run: bundle exec jekyll build --trace
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_site
          force_orphan: true

Commit: “ci: deploy on push to main”.

Test: Merge to main → `gh-pages` branch updated.
```

### Prompt S4-3 – CNAME

```text
Task: Custom domain.

Add file `CNAME`:

docs.domain-box.portacht.ml

Commit: “chore: add CNAME”.

Test: `_site/CNAME` present after build.
```

### Prompt S5-1 – Lighthouse Budget

```text
Task: Performance budget.

1. Add `.lighthouse-budget.json`.

[
  {
    "resourceSizes": [{"resourceType": "total", "budget": 1600}],
    "timings": [{"metric": "first-contentful-paint", "budget": 1500}]
  }
]

2. Add `.github/workflows/lighthouse.yml`.

name: Lighthouse
on:
  schedule: [{ cron: '0 3 * * *' }]
  push: { branches: ['main'] }
jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: 'https://docs.domain-box.portacht.ml'
          budgetPath: '.lighthouse-budget.json'

Commit: “ci: lighthouse budget”.

Test: Workflow passes; FCP ≤ 1500 ms.
```

### Prompt S5-2 – markdown-lint

```text
Task: Lint Markdown.

1. Add `.markdownlint.yml` (default rules, line length 120).
2. Extend ci.yml build job:

      - name: Markdown lint
        run: npx markdownlint-cli '**/*.md' -c .markdownlint.yml

Commit: “ci: markdown lint”.

Test: CI green.
```

### Prompt S5-3 – CONTRIBUTING Guide

```text
Task: Add contributing docs.

Create CONTRIBUTING.md:

# Contributing to Poort8 Docs

* **nav_order**: multiples of 10 within each folder.
* Preview site: `bundle exec jekyll serve`.
* Run link check: `bundle exec htmlproofer _site --disable-external`.
* Add a new product/version: copy folder skeleton, update `nav_order`.

Commit: “docs: contributing guide”.

Test: markdown-lint passes.
```
