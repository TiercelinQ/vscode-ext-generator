---
name: vscode-p2-featuring
description: Phase 2 of the VS Code extension generation cycle — feature elicitation, MoSCoW prioritization, v1.0 scope, calibration confirmed here, blocking validation before Phase 3, written to the analysis spec.
model: sonnet
---

# /vscode-p2-featuring — Requirements analysis

## Role
Requirements analyst — elicit features, prioritize them (MoSCoW), and bound the v1.0 scope.

## Goal
Produce a prioritized feature list, set the v1.0 perimeter, confirm the calibration, and get explicit sign-off before any surface work.

## Deliverable
`docs/specs/02-featuring.md` (written in the user's language) + on-screen sheet.

---

## Instructions — Phase 2: Requirements analysis

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 2/5 — Features; (2) progress line: Scoping ✓ · ▶ Features · Surfaces · Architecture · Development; (3) intent in italics: Elicit, prioritize (MoSCoW), and bound the v1.0 scope. See `## PIPELINE` in `CLAUDE.md`.

Read `docs/specs/01-scoping.md` first (objective + locked parameters). Work in the user's language. Each closed/enumerable choice uses `AskUserQuestion`; open input (feature ideas, custom name) stays free-form text.

### Step 1 — Extension name

Claude **proposes** 2-4 candidate names (`displayName`) derived from the objective, then lets the user decide. **Do not mark a recommended option and do not auto-select** — the name is the user's call (a deliberate local exception to the "always recommend" rule in `CLAUDE.md`, limited to this step). Offer the candidates with `AskUserQuestion`; the built-in **Other** option carries a custom name as free-form text. Block until the user picks a candidate or provides their own. The resolved name feeds the sheet, the spec, and `[APP_NAME]` / `displayName` downstream (and informs the `name`/`publisher` id pattern).

### Step 2 — Feature elicitation (iterative)

From the objective, propose a base set of candidate features. If the Salesforce CLI integration is on, the starter Org Manager (list/add/remove/reconnect/set-default orgs) is a baseline feature — present it as already included. Then loop, asking as free-form text: "Other features to add? (free description, or 'done')". Maintain the running candidate list; stop when the user signals no more ideas.

### Step 3 — MoSCoW prioritization

Propose a reasoned classification of every candidate into **Must / Should / Could / Won't**, shown as a table. Then: "Confirm or list the adjustments." Apply the user's moves.

### Step 4 — v1.0 perimeter

Default derivation: **Must + Should = included in v1.0**; **Could + Won't = excluded**. Present the included/excluded split and ask the user to confirm or move individual features either way.

### Step 5 — Synthesis sheet

Produce the sheet (in the user's language):

## Requirements — [APP_NAME]

**Extension name**
[APP_NAME] (chosen by the user; candidates proposed: [c1], [c2], [c3])

**Objective**
[Concise description, from Phase 1]

**Features by priority (MoSCoW)**
| Priority | Feature | v1.0 |
| -------- | ------- | ---- |
| Must     | …       | ✓    |
| Should   | …       | ✓    |
| Could    | …       | —    |
| Won't    | …       | —    |

**v1.0 perimeter**
- Included (Must + Should): [list]
- Deferred — Could (possible in a later version): [list]
- Dropped — Won't (out of scope, deliberate): [list]

**Technical constraints**
- Runtime: VS Code ≥ [engines floor from Phase 1] · Node (extension host) · TypeScript strict · esbuild
- State: globalState/workspaceState · SecretStorage · configuration
- i18n: [Yes/No] — package.nls + vscode.l10n
- Tests: [Yes/No] — @vscode/test-cli + Mocha
- Icon: [Yes/No]
- Webview: [Yes/No] — native surfaces (auto-themed) otherwise; hosting model (hub / one tab per feature) decided in Phase 3 if ≥ 2 webview features
- Salesforce CLI: [Yes/No] — `sf` v2 runner + starter Org Manager (if Yes)
- Validated libraries: [Phase 1 list]

**Calibration (confirmed here, from the v1.0 feature count)**
- Counted v1.0 features: [N]
- Estimated files: [N]
- Chosen size: [Small | Medium / Large]
- Batches: [N] (incl. 1 test batch if enabled)

Apply the CALIBRATION table in `CLAUDE.md` (canonical source). **The calibration is confirmed here, from the v1.0 feature count, and locked upon validation.** Only the included (v1.0) features are counted — deferred/dropped ones do not enter the count. A webview and/or the Salesforce integration add files and push the size up.

End with:

→ Validation required before Phase 3.
  The calibration is locked upon validation.
  Confirm or list the adjustments.

**Blocking rule**: do not move to Phase 3 until validation is explicit. If partial validation: list the open points, block until full resolution.

## Write the spec

Once validated, write the sheet to `docs/specs/02-featuring.md` (in the user's language), including the extension name, the MoSCoW table with the v1.0 column, and the **two distinct exclusion sections (Deferred — Could / Dropped — Won't)**.

→ Chain to `/vscode-p3-surfaces` after validation.
