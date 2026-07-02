---
name: vscode-generate-readme
description: Analyze the specs and source of an existing VS Code extension project and generate its README.md (objective, features, stack, tree, contribution points, prerequisites, installation). Invoke from the target project root.
model: sonnet
---

# /vscode-generate-readme — Generate the README.md

## Role
Technical writer — produce an accurate project README from specs + code.

## Goal
Write a README that reflects what was actually built (it also renders on the marketplace page).

## Deliverable
`README.md` at the project root.

---

Prerequisite: invoked from the target project root.

Use the native Claude Code tools (no shell — Windows-compatible):

1. **Sources, in priority**: `docs/specs/*` (especially `04-architect.md`) for the intended structure, then the real code:
   - List source files via `Glob` `src/**/*` (exclude `node_modules/`, `dist/`, `out/`).
   - Read `package.json` (the manifest: `engines`, `contributes`, `activationEvents`, scripts), `src/constants.ts`, `src/types.ts`, `src/extension.ts`, `src/models/`, `src/controllers/`, `src/views/`.
   - Detect tests via `Glob` `src/test/**/*.test.ts`.
   - When specs and code disagree, the code is what shipped — describe the code and note the divergence.
2. Generate `README.md` at the root via `Write`:

```markdown
# [APP_NAME] — v[VERSION]

## Objective
[Inferred from docs/specs, the manifest, and the structure — 2 sentences max]

## Features
- [Inferred from the present views/ and controllers/]

## Technical stack
- Target: VS Code ≥ [engines.vscode] · TypeScript strict · esbuild · Icons: codicons
- State: globalState/workspaceState · SecretStorage · configuration
- i18n: [Yes/No — inferred from package.nls*.json + l10n/]
- Webview: [Yes/No — inferred from src/views/webview/ + media/; hosting model if ≥ 2 webviews]
- Salesforce CLI: [Yes/No — inferred from src/models/sf-cli.ts + the `sfPath` setting]
- Tests: [Yes (@vscode/test-cli + Mocha) | No — inferred from the presence of src/test/]

## Architecture
[Actual file tree with the role of each file]

## Contribution points
[tables: commands (id → title → handler → where it appears), views/containers, settings, keybindings]

## Conventions
[MVC layers, native theming, `--vscode-*` tokens (webview), native notifications, security — pointer to the rules]

## Prerequisites
<!-- VS Code [engines.vscode]+. Only if the Salesforce CLI integration is on: the `sf` v2 CLI must be installed and on the PATH (or set the `sfPath` setting). The official standalone installer ships its own Node and avoids the npm `.cmd` shim. The official Salesforce Extension Pack is an optional recommendation, not required. -->

## Installation
npm install
# F5 → Extension Development Host
npm run typecheck    # TypeScript verification
npm run build        # esbuild → dist/extension.js
npm run package      # vsce package → .vsix

## Tests
[Section included only if src/test/ detected]
npm test
```
<!-- To distribute: `vsce publish` / `ovsx publish` (documented, never imposed) -->

3. Write the file via `Write` (never `cat`/heredoc — Windows-incompatible).
4. If anything is undeterminable from specs + code: ask the closed questions with `AskUserQuestion` (clickable options) before writing.

Confirm with: `README.md generated at the project root.`
