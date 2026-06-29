---
name: vscode-p4-architect
description: Phase 4 of the VS Code extension generation cycle — complete architectural contract (tree, role of each file, contribution points, manifest map, state map, webview/sf surfaces), written to the contract spec and locked after validation.
model: sonnet
---

# /vscode-p4-architect — Architectural contract

## Role
Software architect — design the locked structure the whole build will follow.

## Goal
Produce a complete, unambiguous architectural contract that freezes the file tree, the contribution points, the manifest, and the state map.

## Deliverable
`docs/specs/04-architect.md` (written in the user's language) — the locked source of truth + on-screen contract.

---

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 4/5 — Architecture; (2) progress line: Scoping ✓ · Features ✓ · Surfaces ✓ · ▶ Architecture · Development; (3) intent in italics: Lock the file/structure contract. See `## PIPELINE` in `CLAUDE.md`.

At start: read `@rules/architecture.md` (tree, batches, layer conventions), `@rules/manifest.md` (contributes, activation), `@rules/state.md`. If a webview is in scope, read `webview-ui.md` + `@rules/webview.md`. If the Salesforce integration is on, read `@rules/sf-cli.md`. Read `docs/specs/01-scoping.md` through `03-designing.md` for the validated decisions.

Present (in the user's language):

1. **Complete project tree** (model: `@rules/architecture.md`) with the role of each file.
2. **Contribution points table** (ids centralized in `src/constants.ts`):

| Id | Kind | Handler / Provider | Model | Surface (where it appears) |
| -- | ---- | ------------------ | ----- | -------------------------- |
| `myext.entity.refresh` | command | `entity.controller.ts` | `EntityModel.list()` | view title `myext.entityView` |
| `myext.entity.delete` | command | `entity.controller.ts` | `EntityModel.delete(id)` | item context menu |
| `myext.entityView` | view (tree) | `entity-tree.ts` | `EntityModel` | container `myext-container` |

3. **Manifest map** — the `contributes` blocks to write (`commands`, `viewsContainers`, `views`, `menus`, `configuration`, `keybindings`) + the `activationEvents` (empty/auto unless a declared event is needed).
4. **State map** — `globalState`/`workspaceState` keys, `SecretStorage` keys, `configuration` settings (key · type · default · scope). All keys in `constants.ts`.
5. **[If webview]** Record the **hosting model** decided in Phase 3 (`@rules/webview.md` Hosting model): a **hub** (one `viewType` + one open command + the **feature → view map**: which `<nav>` view renders which feature) or **one tab per feature** (one `viewType` + open command per feature, file convention in `@rules/architecture.md`). Then, for **each** webview: its `viewType` id (in `constants.ts`), its type (panel/view — and the open command for a panel), its **layout skeleton + region → content map** (`webview-ui.md` Panel layout), the `HostToWebview` / `WebviewToHost` message union (types + payloads), and the local resources under `localResourceRoots`.
6. **[If Salesforce integration]** sf-cli surface — the `SfCli` helpers exposed, the Org Manager commands/view, and the documented `sf` runtime prerequisite.
7. **Source → test mapping** (only if tests enabled in Phase 1): each major area → its `src/test/*.test.ts` file. See `@rules/tests.md`.

**→ Validation required. This contract is locked.**

Any deviation (merge, split, rename, addition, removal of a file, command/view id, contribution point, or library) requires:

1. Stop.
2. Declare the deviation + justification.
3. Validation before resuming.

## Write the spec

Once validated, write the full contract to `docs/specs/04-architect.md` (in the user's language). This file is the **locked source of truth** re-read by `/vscode-p5-development`, `/vscode-load-project`, `/vscode-show-contract`, `/vscode-add-feature`, and `/vscode-refactor-code`.

→ Chain to `/vscode-p5-development` after validation.
