# Agent Instructions

This repository is developed incrementally. Tasks and milestones are documented in `todo.md` and explained in more detail in `prompt_plan.md`.

## Workflow

1. Open `todo.md` and find the first unchecked prompt section.
2. Locate the matching prompt in `prompt_plan.md` for context and detailed steps.
3. Implement each task using the **thorough red approach**:
   - Write failing tests first.
   - Implement the minimal code to satisfy the tests.
   - Run `poetry run pre-commit run --files <changed files>`.
   - Run `poetry run pytest --cov=orchestrator tests/` until all tests pass.
4. Commit small, focused changes with descriptive messages referencing the prompt to a new branch. Never commit to main.
5. Submit a PR and wait for CI to pass.
6. After the PR is merged into `main` and CI reports green, tick the corresponding checkboxes in `todo.md`.
7. Repeat from step 1 for the next unchecked prompt.

## Quality Gates

- Maintain ≥ 90% test coverage as specified in `todo.md`.
- Keep formatting and linting clean (`black`, `isort`, `flake8`, `mypy`).
- Update documentation and configuration files whenever new environment variables or features are introduced.

## Devcontainer Setup

Evaluate this repository and its dependencies and create a startup script that installs all required packages and runs the tests. Place the script in `.devcontainer/` so the environment is ready for testing before development begins.
