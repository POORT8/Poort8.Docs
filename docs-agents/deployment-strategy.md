# GitHub Actions Deployment Strategy

## Overview

This repository uses a dual-deployment strategy to support the migration from Jekyll to Docsify:

## Workflows

### 1. Docsify Deployment (`.github/workflows/docsify.yml`)

**Purpose**: Deploy the new Docsify-based documentation site
**Trigger**: Pushes to `main` branch (excluding Jekyll-specific paths)
**Approach**: Zero-build deployment - serves files directly

**Key Features**:
- 🚀 **Zero-build**: No compilation step, serves static files directly
- 🔍 **File verification**: Checks for required Docsify files before deployment
- 🌐 **Domain support**: Configured for docs2.poort8.nl via CNAME
- ⚡ **Fast deployment**: Direct file serving, no build pipeline

**Required Files**:
- `index.html` - Docsify entry point
- `.nojekyll` - Disables Jekyll processing
- `_sidebar.md` - Global navigation
- `README.md` - Homepage content
- `assets/` - CSS, images, etc.

### 2. Jekyll Deployment (`.github/workflows/jekyll.yml`)

**Purpose**: Legacy Jekyll deployment (automatically disabled when Docsify detected)
**Trigger**: Changes to `docs/` directory only
**Approach**: Traditional Jekyll build process

**Smart Detection**:
- Automatically skips when `index.html` contains "docsify"
- Ensures smooth transition without manual intervention
- Prevents deployment conflicts

## Migration Strategy

### Phase 1: Docsify Preparation (Current)
- Docsify workflow active and ready
- Jekyll workflow remains as fallback
- Both workflows coexist safely

### Phase 2: Domain Transition
- `docs2.poort8.nl` → Docsify site (new)
- `docs.poort8.nl` → Jekyll site (existing)

### Phase 3: Complete Migration
- Update CNAME to point `docs.poort8.nl` to Docsify
- Remove Jekyll workflow
- Archive Jekyll source files

## Deployment Process

### Automatic Deployment
1. Push changes to `main` branch
2. GitHub Actions detects file changes
3. Docsify workflow runs verification checks
4. Site deployed directly to GitHub Pages
5. Available at docs2.poort8.nl

### Manual Deployment
- Use "Run workflow" button in GitHub Actions
- Useful for testing or emergency deployments

## Monitoring

**Deployment Status**: Check GitHub Actions tab
**Site Health**: Monitor docs2.poort8.nl availability
**Performance**: Docsify loads faster due to zero-build approach

## Troubleshooting

### Common Issues
1. **404 errors**: Check CNAME file and domain configuration
2. **Missing navigation**: Verify `_sidebar.md` is present
3. **Styling issues**: Check `assets/css/custom.css` loads correctly
4. **Search not working**: Verify Docsify search plugin in `index.html`

### Verification Commands
```bash
# Check required files
ls -la index.html .nojekyll _sidebar.md README.md

# Verify Docsify configuration
grep -i docsify index.html

# Test locally
python3 -m http.server 8000
```

## Performance Benefits

- **Zero build time**: No Ruby/Jekyll compilation
- **Fast updates**: Changes deploy immediately  
- **Simple maintenance**: No dependency management
- **Better caching**: Static files cache efficiently
- **Mobile optimized**: Responsive design built-in

## Team Workflow

1. **Development**: Make changes locally, test with local server
2. **Commit**: Use feature branches with Linear task names
3. **Deploy**: Merge to `main` triggers automatic deployment
4. **Verify**: Check docs2.poort8.nl for live changes

This deployment strategy ensures reliable, fast documentation updates while maintaining the flexibility for rollback during the transition period.
