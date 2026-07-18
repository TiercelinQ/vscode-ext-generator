---
name: vscode-p1-scoping
description: Phase 1 of the VS Code extension generation cycle — scoping in grouped questions (i18n, tests, webview, a conditional Salesforce CLI opt-in shown only when the objective mentions Salesforce, icon), engine floor announcement, calibration announcement, and writing of the scoping spec.
model: sonnet
---

# /vscode-p1-scoping — Scoping

## Role
Project scoper — turn a vague idea into a bounded, validated scope.

## Goal
Lock the project parameters (tests, webview, i18n, Salesforce CLI, icon, engine floor, calibration) before any analysis.

## Deliverable
`docs/specs/01-scoping.md` (written in the user's language) + on-screen summary.

---

## 1. Questions

**Phase banner (show first)** — on a new extension, first list the 5 phases once (overview in `## PIPELINE` of `CLAUDE.md`). Then output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 1/5 — Scoping; (2) progress line: ▶ Scoping · Features · Surfaces · Architecture · Development; (3) intent in italics: Destination folder and project parameters.

Start with the objective, then establish the project root (folder name → location → creation), then ask the closed parameters with the `AskUserQuestion` tool (clickable options, the recommended one first). There is **no palette** — VS Code themes every native surface automatically.

1. **Objective** — plain text, **not** `AskUserQuestion` (free-form, non-enumerable): "What does the extension do? (free description)".

### Project root (folder name → location → creation)

> Skip this block if a project root is already established for this flow.

- **Folder name** — propose 2-4 candidate names derived from the objective, **in kebab-case** (e.g. `org-explorer`), the recommended one first, with `AskUserQuestion` (the **Other** option carries a custom name as free-form text). This is the **project directory name**, distinct from the extension `displayName` chosen in Phase 2.
- **Location** — free-form text: `Parent folder where to create the project? (path, e.g. C:\projects)`.
- **Create the folder** — project root = `[parent]\[folder-name]`. Create it, then confirm: `Project root: [path]`. If it already exists and is not empty, warn and ask the user to confirm reuse or pick another name. Store this path as the project root — all generated files and specs (`docs/specs/`) are written there.

### Closed parameters

> **Salesforce detection (before call 1)** — scan the objective text for the Salesforce cluster: `Salesforce`, `sf`/`sf CLI`, `org`, `scratch org`, `sandbox`, `Apex`, `SOQL`/`SOSL`, `sObject`, `metadata`/`deploy`/`retrieve`, `package`/`2GP`, `permission set`, `Dev Hub`, `Agentforce`. The **Salesforce CLI integration** question below is asked **only when at least one term matched**: if it matched, include that question in call 1 with its recommended default set to `Yes` and a one-line rationale ("the objective mentions Salesforce"); the user still confirms and may keep `No` (e.g. an extension that only references Salesforce without driving `sf`). **If no term matched, omit the Salesforce question entirely** — the integration stays off (call 1 then carries only i18n, tests, and webview), and the user can still enable it later by asking explicitly. The single resolved Yes/No governs both `@rules/sf-cli.md` and the `sf-cli-reference/` catalog (gate `@rules/sf-cli.md`).

2. **`AskUserQuestion` — call 1** (3 questions, plus a 4th only when the Salesforce detection above matched):
   - **FR/EN i18n** (FR default): `No` (recommended, unless a real EN need) · `Yes`. — `package.nls.json` + `vscode.l10n` (`@rules/i18n.md`).
   - **Automated tests** (`@vscode/test-cli` + Mocha): `Yes` (recommended, pro use) · `No`.
   - **Webview UI**: `No` (recommended — native surfaces cover most needs) · `Yes`. If `Yes`, the binding reference `webview-ui.md` applies and the build adds a webview entry. A webview is only for UI that a tree view / quick pick / settings cannot express.
   - **Salesforce CLI integration** (`sf` v2) — **included only when the Salesforce detection above matched** (otherwise this question is omitted and the integration stays off, reachable later on explicit request). When shown, the recommended option is `Yes` (rationale: the objective mentions Salesforce); the user may still keep `No` (e.g. an extension that only references Salesforce without driving `sf`). If `Yes`, `@rules/sf-cli.md` applies (it routes to the `sf-cli-reference/` command catalog) and the default scaffold adds the `sf` runner + typed helpers + a starter Org Manager (tree view). `sf` becomes a runtime prerequisite (detected); the official Salesforce pack stays an optional recommendation, not a hard dependency.
3. **`AskUserQuestion` — call 2** (1 question):
   - **Extension icon**: `No` (recommended — VS Code default, can be added later) · `Yes`. If `Yes`, ask the `.png` path (128px+) as free-form text.

## 2. Engine floor (announced, not asked)

Announce the `engines.vscode` policy: **conservative floor** (~6-12 months back) for broad compatibility, with `@types/vscode` pinned **exactly** to that floor. **Verify the current VS Code version** before pinning (`npm view @types/vscode versions`, VS Code release notes) and state the chosen floor. See `@rules/manifest.md` / `@rules/config.md`. Fixed by the framework (announced, not voted): TypeScript strict, esbuild, native VS Code theming, native state stores (no DB).

## 3. Provisional calibration — announced at the end of Phase 1

Apply the CALIBRATION table in `CLAUDE.md` (canonical source) — it holds the size thresholds, the batch counts, and the +1 batch when tests are enabled; do not restate them here. A webview and/or the Salesforce integration add files and push the size up (no dedicated batch).

Announce it as **provisional** (template, rendered in the user's language):

Provisional calibration: [Small | Medium/Large] — [N] batches (incl. 1 test batch if enabled)
(Confirmed at the end of Phase 2, after counting the real features.)

The real feature count is not known yet (features are elicited in Phase 2). The calibration is **confirmed and locked at the end of Phase 2**, on the v1.0 feature count.

## 4. Libraries

Any library outside the stack (a parser, a schema lib like zod…) is proposed and validated here — none can be added later without a declaration protocol. Default: no extra runtime dependency (`vscode` API + native stores cover most needs; `sf` integration shells out, no lib).

## 5. Write the spec

Write `docs/specs/01-scoping.md` (in the user's language) capturing: objective, i18n, tests, webview (Yes/No), Salesforce CLI integration (Yes/No), icon, the engine floor (with the verified current version noted), validated libraries, and the provisional calibration (size + number of batches — confirmed in Phase 2). If `docs/specs/` does not exist yet, create it (it will live in the generated project root).

→ Chain to `/vscode-p2-featuring` after validation.
