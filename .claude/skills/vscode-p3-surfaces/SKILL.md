---
name: vscode-p3-surfaces
description: Phase 3 of the VS Code extension generation cycle — surfaces & UX, mapping the validated features onto VS Code contribution points (commands, views, status bar, menus, webview), validated synthesis written to the spec before Phase 4.
model: sonnet
---

# /vscode-p3-surfaces — Surfaces & UX

## Role
UX designer — map the validated features onto VS Code's native contribution points.

## Goal
Decide which surfaces the extension exposes (commands, views, status bar, menus, optional webview) and how the user reaches each feature.

## Deliverable
`docs/specs/03-surfaces.md` (written in the user's language) + on-screen synthesis.

---

## 1. Proposal

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 3/5 — Surfaces; (2) progress line: Scoping ✓ · Features ✓ · ▶ Surfaces · Architecture · Development; (3) intent in italics: Map the validated features onto VS Code contribution points. See `## PIPELINE` in `CLAUDE.md`.

There is **no design-system or layout to honor** for native surfaces — VS Code themes them automatically. **If a webview is in scope (Phase 1 = Yes), read `webview-ui.md`** before proposing the webview UI.

**Each webview is a first-class surface.** For every webview, decide: its `viewType` id + purpose, its type (panel/view), its **layout structure**, and the intents it raises (these drive the Phase 4 message contract). The structure uses the closed region vocabulary from `webview-ui.md` (Panel layout): Level-1 landmarks `header / nav / main / aside / footer` arranged by a skeleton (A main · B header+main · C header+main+footer · D aside+main · E header+aside+main · F toolbar+nav/list+main, or a composed `grid-template-areas` from the same landmarks); `section`/`article` structure the content **inside** `main`. Keep it native (token-driven, flat). If the extension ships more than one webview, repeat per webview.

**Webview hosting model (only if ≥ 2 features map to webview).** Decide **once** how the webview features are hosted (`@rules/webview.md` Hosting model): a **hub** (one webview, internal `<nav>` switching feature views — one `viewType`/command) or **one tab per feature** (one `viewType` + open command per feature). Recommend **contextually** — hub when the features are tightly-related views of the **same** dataset/workspace, one tab per feature when they are **independent**. A single webview feature is trivially one webview (skip). This sets how many `viewType`s/commands the Phase 4 contract locks, and — for a hub — the feature → view map.

Based on `docs/specs/02-featuring.md`, propose how each v1.0 feature surfaces:
1. Map each feature to a surface: **command** (Command Palette / menu), **tree view** (sidebar list), **status bar item**, **quick pick** (input/selection), **webview** (only if a tree/quick pick/settings cannot express it), **setting** (configuration).
2. Justify each mapping against the feature (prefer native over webview).
3. Describe the navigation: which activity-bar view container, which views in it, which commands appear where (view title, item context menu, palette), which status bar items, which keybindings (each with a `when`).

Produce (in the user's language):

## Proposed surfaces — [APP_NAME]

**Surface mapping**
| Feature | Contribution point | Where it appears |
| ------- | ------------------ | ---------------- |
| …       | …                  | …                |

**Navigation**
[view container(s) and views · command placement (palette / view title / item context) · status bar items · keybindings (each with a `when`)]

**Webviews (if any)**
- [per webview: `viewType` id · type (panel/view) · purpose · layout skeleton — hosting model if ≥ 2 webview features]

## 2. Customization — questions via `AskUserQuestion`

For each closed question, mark the recommended option `(recommended)`, chosen from the validated feature context. Ask only the questions the features actually raise (skip the rest):

1. **Primary surface**: dedicated activity-bar view container (recommended for a tool with its own panel) · contributed into an existing container (Explorer/SCM) · commands only (no view).
2. **Main list UI**: tree view (recommended) · quick pick on command · webview (only if justified and enabled in Phase 1).
3. **Status bar**: yes — show state/quick action (recommended if there is a persistent state) · no.
4. **Command surfacing**: Command Palette + contextual menus (recommended) · palette only.
5. **[If ≥ 2 features map to webview]** Webview hosting model: **one tab per feature** (one `viewType` + open command each) · a single **hub** webview (internal `<nav>` between feature views). Mark the recommended option from feature cohesion (hub = related views of one dataset; one tab per feature = independent features). Skip when 0-1 feature is on webview.
6. **[If webview enabled — once for a hub, per webview for one tab per feature]** Webview type: `WebviewPanel` editor tab (recommended — full editor area, opened by a command, no view container) · `WebviewView` docked in a sidebar/panel (only when the UI must stay persistently docked next to the tree views).
7. **[If webview enabled — once for a hub, per webview for one tab per feature]** Layout skeleton (from `webview-ui.md` Panel layout): offer the 3-4 skeletons most relevant to the webview's purpose as options (recommended first), plus **Other** for a composed/custom `grid-template-areas` built from the same five landmarks. Then capture the **region → content map** and which regions are **interactive** (those become `WebviewToHost` intents in Phase 4). For a hub, the `<nav>` region drives the feature → view switch.
8. **Keybindings**: propose a default for the most-used command (recommended) · none.

If the Salesforce Org Manager is in scope, its surface is a tree view in a dedicated container with item context commands (add/remove/reconnect/set-default) and a view-title refresh — present it as the baseline and confirm.

## 3. Synthesis

Produce a complete synthesis: the view container(s) and view(s), the command list and where each appears (palette / view title / item context / keybinding with its `when`), status bar items, settings, the webview **hosting model** if ≥ 2 features are on webview (hub vs one tab per feature; for a hub, the feature → view map), and — per webview — its `viewType` id, type (panel/view), purpose, **layout skeleton + region → content map**, and interactive regions. Note any activation event beyond the auto-generated ones, with justification.

**→ Explicit validation required before Phase 4.**

## 4. Write the spec

Once validated, write the synthesis to `docs/specs/03-surfaces.md` (in the user's language).

→ Chain to `/vscode-p4-architect` after validation.
