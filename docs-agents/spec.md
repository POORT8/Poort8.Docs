# Poort8 Documentation Site — Developer Specification
*Target environment: **GitHub Pages** · Generator: **Docsify 4.x** · Domain: **docs2.poort8.nl***

---

## 1 · Project Goals & Scope

| Goal | Detail |
|------|--------|
| **Single docs portal** | Host all Poort8 dataspace docs at `https://docs2.poort8.nl/`. |
| **Dataspace-oriented structure** | Dataspaces: **HeyWim · DVU · GIR · CDA**<br>Each dataspace contains documentation pushed from respective source repos. |
| **Extensible** | New dataspaces / implementations / versions must drop-in without code changes. |
| **Corporate branding** | Use Poort8 logo and Poort8 primary colours (light theme only). |
| **Searchable & navigable** | Per-dataspace sidebars + Docsify built-in search. |
| **Zero-build hosting** | Static file serving via GitHub Pages — no build pipeline required. |

---

## 2 · High-Level Architecture

```
repo (main)
├─ index.html           Docsify entry point + config
├─ _sidebar.md          Global navigation
├─ README.md            Homepage content
├─ assets/              Images, custom CSS
└─ dataspaces/
    ├─ heywim/
    │   ├─ _sidebar.md   Dataspace-specific navigation
    │   └─ *.md          Documentation files (supplied by HeyWim repo)
    ├─ dvu/
    │   ├─ _sidebar.md
    │   └─ *.md          Documentation files (supplied by DVU repo)
    ├─ gir/
    │   ├─ _sidebar.md
    │   └─ *.md          Documentation files (supplied by GIR repo)
    └─ cda/
        ├─ _sidebar.md
        └─ *.md          Documentation files (supplied by CDA repo)
↓  (Direct serve)
GitHub Pages  →  docs2.poort8.nl
```

| Decision | Rationale |
|----------|-----------|
| **Docsify 4.x** | Zero-build static site generator with runtime rendering. |
| **Per-dataspace _sidebar.md** | Each dataspace controls its own navigation structure. |
| **Docsify search** | Built-in full-text search, no external dependencies. |
| **Direct file serving** | No Ruby/Jekyll build process — just serve static files. |
| **GitHub Pages direct** | Serve main branch directly, no gh-pages workflow needed. |

---

## 3 · Information Architecture & File Layout

### 3.1 Docsify Entry Point (`index.html`)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Poort8 Documentation</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify@4/lib/themes/vue.css">
  <link rel="stylesheet" href="assets/css/custom.css">
</head>
<body>
  <div id="app"></div>
  <script>
    window.$docsify = {
      name: 'Poort8 Documentation',
      repo: 'https://github.com/Poort8/Poort8.Docs',
      loadSidebar: true,
      subMaxLevel: 3,
      search: 'auto',
      logo: 'assets/images/poort8-logo.svg'
    }
  </script>
  <script src="//cdn.jsdelivr.net/npm/docsify@4"></script>
  <script src="//cdn.jsdelivr.net/npm/docsify/lib/plugins/search.min.js"></script>
</body>
</html>
```

### 3.2 Global Navigation (`_sidebar.md`)

```markdown
* [Home](/)
* [Dataspace Guide](/guide.md)

**Dataspaces**
* [HeyWim](/dataspaces/heywim/)
* [DVU](/dataspaces/dvu/)
* [GIR](/dataspaces/gir/)
* [CDA](/dataspaces/cda/)
```

### 3.3 Per-Dataspace Structure

**Example: DVU Dataspace**
```
dataspaces/dvu/
├─ _sidebar.md          # DVU-specific navigation
├─ README.md            # DVU overview 
└─ *.md                 # Additional docs (supplied by DVU repo)
```

**DVU `_sidebar.md` example:**
```markdown
* [DVU Overview](dataspaces/dvu/)
* [Quick Start](dataspaces/dvu/quick-start.md)
* [API Reference](dataspaces/dvu/api.md)
* [FAQ](dataspaces/dvu/faq.md)
```

*Note: Each dataspace (HeyWim, DVU, GIR, CDA) will have its own structure and content supplied by the respective source repositories. The exact navigation and content structure is determined by each dataspace team.*

### 3.4 Versioned Documentation

*Versioned docs and internal structure will be managed by each dataspace's source repository. This documentation site hosts the content but does not dictate the internal organization.*

---

## 4 · Styling & Theming

| Item | Implementation |
|------|----------------|
| **Logo** | `assets/images/poort8-logo.svg` (placeholder until supplied). |
| **Colors** | Override Docsify CSS vars in `assets/css/custom.css` (`--theme-color`, etc.). |
| **Layout tweaks** | CSS: responsive sidebar, max-width constraints, search styling. |
| **Dark-mode** | Not in scope (light-theme only). |

**Custom CSS example (`assets/css/custom.css`):**
```css
:root {
  --theme-color: #0066cc;           /* Poort8 primary */
  --theme-color-secondary: #004499;  /* Poort8 secondary */
}

.sidebar {
  border-right: 1px solid #eee;
}

.content {
  max-width: 1040px;
}
```

---

## 5 · Content Conventions

- **Markdown** with no front-matter required (unlike Jekyll).
- **Optimized images** ≤ 150 kB (SVG preferred).
- **External API docs** open in new tab (`target="_blank" rel="noopener"`).
- **Cross-references** use relative paths from dataspace root.

---

## 6 · Error Handling & Build Safeguards

| Layer | Strategy |
|-------|----------|
| **404** | Docsify handles 404s automatically with search field. |
| **Broken links** | Manual testing or future CI link checking. |
| **Search index** | Built automatically by Docsify at runtime. |

---

## 7 · GitHub Pages Deployment

**New Docsify Pipeline:**
1. **Direct serving** — GitHub Pages serves `main` branch root `/` directly.
2. **CNAME** → `docs2.poort8.nl` (during transition).
3. **No build step** — Docsify renders at browser runtime.

**Domain transition:**
- Phase 1: `docs2.poort8.nl` (new Docsify site)
- Phase 2: `docs.poort8.nl` (migrate from Jekyll to Docsify)

---

## 8 · Testing Plan

| Phase | Verify | How |
|-------|--------|-----|
| **Build** | No broken links & search works | Manual browser testing. |
| **Manual** | Sidebar, navigation, search | Chrome, Firefox, Safari, Edge (desktop & mobile). |
| **Performance** | FCP < 1.5s | Lighthouse (manual or CI). |
| **Accessibility** | Contrast & keyboard nav | Axe extension. |

---

## 9 · Implementation Checklist

- [ ] Create `index.html` with Docsify configuration.
- [ ] Add global `_sidebar.md` with dataspace navigation.
- [ ] Create `dataspaces/` directory structure.
- [ ] Add per-dataspace `_sidebar.md` files.
- [ ] Place logo SVG & define brand colors in `assets/css/custom.css`.
- [ ] Configure GitHub Pages to serve from `main` branch root.
- [ ] Set CNAME to `docs2.poort8.nl`.
- [ ] Test navigation, search, and responsive design.
- [ ] Verify backward compatibility links work.

---

## 10 · Backward Compatibility

*Specific legacy links will be preserved where needed. The exact backward compatibility requirements will be determined by each dataspace team during migration.*

**Implementation:** 
- Maintain file paths where possible to preserve existing URLs.
- Consider redirect rules if path structure changes significantly.

---

## 11 · Future Enhancements (out of scope)

- **Dark-mode toggle**.
- **Advanced search** with Algolia DocSearch.
- **Analytics** integration.
- **Interactive code samples**.

---

## 12 · Migration from Jekyll

*Note: The current Jekyll-based system at `docs.poort8.nl` remains active during transition. This Docsify specification replaces the Jekyll system once complete and reviewed.*

**Jekyll legacy features:**
- Built with Ruby/Jekyll + Minima theme
- Used `jekyll-navigation` for sidebars
- Required GitHub Actions build pipeline

**Docsify advantages:**
- Zero build process — pure static files
- Runtime rendering with client-side search
- Simpler maintenance and deployment
- Better developer experience

---

**Ready for development.**
Clone → create `index.html` → follow checklist → push to `main` → GitHub Pages serves directly.
