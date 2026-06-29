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

1. **Sources, in priority**: `docs/specs/*` (especially `04-architect.md`) for the intended structure, then the real code — `package.json` (`engines`, `contributes`, `activationEvents`, scripts), `src/constants.ts`, `src/extension.ts`, `src/models/`, `src/controllers/`, `src/views/`. When specs and code disagree, the code is what shipped — describe the code and note the divergence.
2. Generate `README.md` at the root:

```markdown
# [APP_NAME]

[Objective inferred from specs/code — 2 sentences max]

## Features
[bullet list of the v1.0 features]

## Requirements
- VS Code [engines.vscode]+
[- Salesforce CLI (`sf` v2) on the PATH — and the official Salesforce Extension Pack is recommended (optional) — only if the sf integration is on]

## Stack
[table: VS Code engine, TypeScript, esbuild, state (globalState/secrets/configuration), i18n, tests]

## Contribution points
[tables: commands (id → title → where), views/containers, settings, keybindings]

## Tree
[real tree with the role of each file]

## Conventions
[MVC layers, native theming, security — pointer to the rules]

## Installation & run
\`\`\`
npm install
# F5 → Extension Development Host
npm run build        # esbuild → dist/extension.js
npm run package      # vsce package → .vsix
\`\`\`
[npm test — if tests enabled]
[vsce publish / ovsx publish — to distribute]
```

3. Write the file to disk, confirm in one line (in the user's language).
4. If anything is undeterminable from specs + code: ask the closed questions with `AskUserQuestion` (clickable options) before writing.
