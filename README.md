# Poort8 Documentation

Welcome to the Poort8 documentation portal. This site hosts documentation for all Poort8 dataspaces.

## Getting Started

This documentation site is built with Docsify and provides information about:

- **HeyWim** - [Coming in next steps]
- **DVU** - [Coming in next steps] 
- **GIR** - [Coming in next steps]
- **CDA** - [Coming in next steps]

## About This Site

This is the new Docsify-based documentation site that replaces the previous Jekyll-based system. It provides:

- Zero-build hosting via GitHub Pages
- Runtime rendering for fast updates
- Full-text search across all content
- Dataspace-oriented navigation

More content and navigation will be added in subsequent implementation steps.

## Project Structure

This repository follows the GitHub Pages with Jekyll structure using the `/docs` directory as the source:

```
.
├── docs/                     # Source directory for Jekyll
│   ├── _config.yml          # Jekyll configuration
│   ├── index.md             # Home page
│   ├── guide.md             # Product guide
│   ├── CNAME               # Custom domain configuration
│   ├── heywim/             # HeyWim product docs
│   │   ├── index.md
│   │   ├── quick-start.md
│   │   └── faq.md
│   ├── keyper/             # Keyper product docs
│   │   ├── index.md
│   │   ├── quick-start.md
│   │   └── faq.md
│   └── noodlebar/          # Noodlebar product docs
│       ├── index.md
│       ├── quick-start.md
│       └── faq.md
├── .devcontainer/          # Development container configuration
├── .github/workflows/      # GitHub Actions workflows
├── .vscode/               # VS Code workspace settings
├── Gemfile               # Ruby dependencies
└── README.md            # This file

## Setting up the Devcontainer

To set up the devcontainer for building and testing this repository in GitHub Codespaces, follow these steps:

1. Ensure the directory `.devcontainer` exists, with a file `devcontainer.json`
2. Ensure that the `Gemfile` includes the necessary dependencies for testing, as already specified in `Gemfile`.
3. Verify that the devcontainer setup works by opening the repository in GitHub Codespaces and running the build and test tasks.

## Running the CI Workflow

To run the CI workflow for this repository, follow these steps:

1. Ensure that the `.github/workflows/ci.yml` file is present with the following content:
2. Ensure that the `Gemfile` includes the necessary dependencies for testing under the `:test` group:
3. Push your changes to the repository or create a pull request. The CI workflow will automatically run on push and pull request events.
4. Verify that the CI workflow runs successfully and that the build and tests pass without errors.

## Running Locally Using VS Code Tasks

The repository includes VS Code tasks for common operations:
1. **Jekyll: Serve (Production)** - Start the site server with live reload
2. **Jekyll: Build** - Build the site once
3. **Jekyll: Test** - Run HTML Proofer tests on the built site
4. **Jekyll: Clean** - Clean the Jekyll build

To run these tasks:
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
2. Type "Tasks: Run Task"
3. Select the desired task

### Using Terminal Commands

Alternatively, you can run these commands in the terminal:

```bash
# Build the site
bundle exec jekyll build --source docs

# Serve the site with live reload
bundle exec jekyll serve --livereload --source docs

# Test the site
bundle exec htmlproofer ./_site --disable-external
```