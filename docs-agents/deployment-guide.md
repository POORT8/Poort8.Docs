# GitHub Pages Deployment Guide

**Date**: 2025-06-24  
**Task**: SUPER-76  
**Status**: Active

## Deployment Configuration

### GitHub Pages Settings
- **Source**: Deploy from main branch root (`/`)
- **Jekyll**: Disabled via `.nojekyll` file
- **Domain**: docs2.poort8.nl (transition domain)
- **HTTPS**: Automatically provisioned by GitHub

### File Requirements
```
/
├── index.html          # Docsify entry point
├── .nojekyll          # Disables Jekyll processing
├── CNAME              # Custom domain configuration
├── _sidebar.md        # Global navigation
├── README.md          # Homepage content
└── assets/            # Static assets (CSS, images)
```

## Deployment Process

### 1. Branch Management
- Create feature branch using Linear suggested name
- Implement changes
- Test locally with `python3 -m http.server`
- Commit and push to feature branch

### 2. GitHub Pages Activation
1. Navigate to repository Settings → Pages
2. Set Source to "Deploy from a branch"
3. Select "main" branch and "/ (root)" folder
4. Save configuration

### 3. Domain Configuration
1. CNAME file contains: `docs2.poort8.nl`
2. DNS must point to GitHub Pages IPs:
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153
3. HTTPS certificate auto-provisioned by GitHub

### 4. Validation Steps
- [ ] Site loads at https://docs2.poort8.nl
- [ ] Docsify renders correctly (no Jekyll interference)
- [ ] Search functionality works
- [ ] Navigation between pages works
- [ ] Mobile responsiveness verified
- [ ] HTTPS certificate active

## Performance Targets
- **First Contentful Paint**: < 1.5s (per spec.md section 8)
- **Docsify assets**: Served from CDN
- **Custom assets**: Optimized (images ≤ 150 kB)

## GitHub Actions Workflow Details

### Docsify Deployment Workflow

The Docsify deployment uses a **zero-build approach** that serves static files directly from the repository root:

```yaml
# Triggers: Changes to root-level Docsify files
triggers:
  - index.html (Docsify entry point)
  - _sidebar.md (Navigation)  
  - README.md (Home page content)
  - *.md files (Documentation pages)
  - assets/ (Stylesheets, images, scripts)
  - .nojekyll (GitHub Pages configuration)
  - CNAME (Domain configuration)

# Deployment process:
1. Checkout repository
2. Upload entire repository as artifact  
3. Deploy directly to GitHub Pages
4. Verify deployment and domain configuration
```

### Jekyll Deployment Workflow  

The Jekyll deployment builds from the `docs/` directory and serves the generated site:

```yaml
# Triggers: Changes to Jekyll documentation
triggers:
  - docs/**/*.md (Markdown content)
  - docs/_config.yml (Jekyll configuration)
  - docs/_layouts/ (Page templates)
  - docs/_includes/ (Reusable components)
  - docs/_sass/ (Stylesheets)
  - docs/_plugins/ (Jekyll plugins)

# Deployment process:
1. Checkout repository
2. Setup Ruby and Jekyll dependencies
3. Build site from docs/ directory
4. Upload built _site as artifact
5. Deploy to GitHub Pages
6. Verify deployment
```

### Mutual Exclusivity

Both workflows use the same concurrency group to prevent conflicts:

```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false
```

This ensures that if both workflows trigger simultaneously, they queue properly rather than interfering with each other.

## Domain Configuration

### Primary Domain: docs.poort8.nl
- **System**: Jekyll
- **Content**: Existing documentation
- **Status**: Production stable

### Migration Domain: docs2.poort8.nl  
- **System**: Docsify
- **Content**: New documentation structure
- **Status**: Migration target

### DNS Configuration Required

The team will need to configure DNS to point `docs2.poort8.nl` to GitHub Pages:

```
docs2.poort8.nl CNAME poort8.github.io
```

Or using A records if CNAME is not preferred:
```
docs2.poort8.nl A 185.199.108.153
docs2.poort8.nl A 185.199.109.153  
docs2.poort8.nl A 185.199.110.153
docs2.poort8.nl A 185.199.111.153
```

## Monitoring and Verification

### Post-Deployment Checks

After each deployment, the workflows perform these verifications:

**Docsify Workflow:**
- ✅ Deployment URL accessibility
- ✅ Custom domain resolution (docs2.poort8.nl)
- ✅ Runtime rendering functionality
- ✅ Search functionality status
- ✅ Mobile responsiveness indicators

**Jekyll Workflow:**
- ✅ Build success and artifact size
- ✅ Deployment URL accessibility  
- ✅ Custom domain resolution (docs.poort8.nl)
- ✅ Generated page count verification

### Manual Verification Steps

After deployment, manually verify:

1. **Basic functionality**: Navigate to both domains and check loading
2. **Search functionality**: Test search on Docsify site
3. **Navigation**: Verify all sidebar links work
4. **Content accuracy**: Spot-check key documentation pages
5. **Mobile responsiveness**: Test on mobile devices
6. **Performance**: Check page load speeds

## Troubleshooting

### Common Issues

**Docsify not rendering (shows raw HTML):**
- Verify `.nojekyll` file exists in repository root
- Check `index.html` Docsify configuration is correct
- Ensure assets are accessible (check browser dev tools)

**Domain not resolving:**
- Verify CNAME file contains correct domain
- Check DNS configuration with team
- Wait up to 24 hours for DNS propagation

**Search not working:**
- Verify search plugin is enabled in `index.html`
- Check that `README.md` and other content files are accessible
- Test search functionality locally first

**Workflow conflicts:**
- Check GitHub Actions logs for concurrency queue status
- Verify both workflows aren't trying to deploy simultaneously
- Review concurrency group configuration

### Performance Optimization

**Docsify Performance Tips:**
- Keep asset files small (images, CSS)
- Use CDN for Docsify core files (already configured)
- Minimize custom CSS and JavaScript
- Optimize image sizes and formats

**Jekyll Performance Tips:**
- Review and optimize included plugins
- Minimize SASS compilation complexity
- Use Jekyll's built-in optimization features
- Consider enabling Jekyll's incremental builds

---

**Deployment Status**: Ready for GitHub Pages activation
