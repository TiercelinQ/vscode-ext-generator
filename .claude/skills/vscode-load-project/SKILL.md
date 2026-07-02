---
name: vscode-load-project
description: Load an existing VS Code extension project (Phase 5 complete) from its specs and README — bring the generator rules to bear on already-delivered code. Invoke from the target project root.
model: sonnet
---

# /vscode-load-project — Load an existing project

## Role
Onboarding analyst — take charge of a delivered codebase under the generator rules.

## Goal
Understand the project's structure and confirm the rules apply to any later change.

## Deliverable
A one-block confirmation (in the user's language) of the loaded project.

---

Prerequisite: invoked from the target project root, `.claude/` present.

> If the project root has not been provided in this flow, first ask: `Project root to load? (folder path)`. Read everything below relative to that root.

1. **Read the source of truth in priority order:**
   - `docs/specs/04-architect.md` (locked contract — most reliable). If present, it is authoritative for the structure and the contribution points.
   - Other `docs/specs/*` for the scoping/analysis/surfaces decisions.
   - `README.md` at the root. If both specs and README are absent: offer `/vscode-generate-readme` and stop.
2. **Detect tests** via `Glob` with the pattern `src/test/**/*.test.ts` → count the files for the Tests line.
3. Read `package.json` (the manifest: `engines`, `contributes`, `activationEvents`, `main`, scripts) + walk `src/` to confirm the structure (constants / types / models / controllers / views).
4. Confirm take-over with this exact format (in the user's language):

Project loaded: [APP_NAME] v[VERSION]

Stack : VS Code extension · TypeScript · esbuild
Contributions: [N commands · M views · settings/keybindings]
Entities detected: [list]
Webview: [hub | per-feature | none]
Tests : [present ([N] files) | absent]
Salesforce CLI: [enabled (sf v2 runner) | disabled]
Specs: [docs/specs present: yes/no]

Generator rules applied. Ready for: development · fixes · improvements · adjustments.

5. Read and apply all rules (`CLAUDE.md`, `@rules/architecture.md` · `@rules/manifest.md` · `@rules/state.md` · `@rules/errors.md` · `@rules/security.md` · `@rules/config.md` · `@rules/verification.md`, + `@rules/webview.md`/`webview-ui.md` if webview, `@rules/sf-cli.md` if sf, `@rules/tests.md` if tests present) to any later change. The `@rules/*` are not auto-imported: read them before any code change.
6. Any structural or security deviation detected between the code and the rules (or vs `docs/specs/04-architect.md`): report it, do not fix without a request (hand off to `/vscode-fix-issue` or `/vscode-refactor-code`).
