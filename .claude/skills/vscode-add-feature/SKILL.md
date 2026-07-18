---
name: vscode-add-feature
description: Add a feature, command, view, entity, or change to a VS Code extension already delivered by this framework. Use when the user asks to add or modify functionality on an existing project, respecting the locked architectural contract and the security rules.
model: sonnet
---

# /vscode-add-feature — Add a feature to a delivered extension

## Role
Senior VS Code extension developer working on an existing, contracted codebase.

## Goal
Add the requested feature end-to-end (model → controller → view + manifest), contract-compliant, secure, after an explicit contract-diff validation, without scope creep.

## Deliverable
The created/modified files on disk (one batch) + an updated `docs/specs/04-architect.md` if the structure changed + verified build.

---

## Prerequisite

The project must be loaded (`/vscode-load-project` run at session start, OR `docs/specs/04-architect.md` / README.md present and read).

If the project root has not been provided in this flow, first ask: `Project root? (folder path)`.

If no contract is known: stop and ask for `/vscode-load-project`.

**Load context**: read `docs/specs/04-architect.md` (locked contract), then `@rules/architecture.md` · `@rules/manifest.md` · `@rules/state.md` · `@rules/errors.md` · `@rules/config.md` · `@rules/security.md` · `@rules/webview.md` (if webview) · `@rules/sf-cli.md` (if the Salesforce CLI integration is on) · `@rules/versioning.md` · `@rules/verification.md` (not auto-imported). Read `webview-ui.md` on demand before any webview UI change. For an `sf`-related change, consult the matching `sf-cli-reference/` section file before writing any command/flag.

## Step 1 — Light feature scoping

Ask the closed parameters with `AskUserQuestion` (clickable options, recommended first); the short description (Q1) stays free-form text:

New feature — a few questions:

1. Short description (1 sentence)
2. Business entity affected: [existing: list] | new (to name)
3. Type of change:
   A. New entity (model + controller + view)
   B. Extension of an existing entity
   C. New native surface (command, tree view, status bar item — no new model)
   D. Webview-only change (HTML/CSS/messages)
4. Generate tests for this feature? Yes / No (recommended: aligned with the project stack)

Mark a `(recommended)` option for each closed question, inferred from the existing project. If the request stays ambiguous (business rule, edge case), state assumptions explicitly and ask before the diff.

## Step 2 — In-contract OR deviation

Decide before writing anything:
- **In-contract** — a new entity or an extension within the MVC split (`model + controller + view`), a new command/view whose id is declared in `constants.ts` with its `contributes` entry and registered handler, a new setting read through the wrappers, a new region/message within the locked webview skeleton. Proceed to the diff as a straightforward addition.
- **Deviation** — a new library/dependency, a new webview (`viewType`) or a change of hosting model, an explicit `activationEvents` entry, a change to the security posture (CSP, `localResourceRoots`, secrets), a second file for one entity beyond `model + controller + view`, or anything the locked contract does not cover. **STOP → declare the deviation in the diff, explain why → wait for validation before writing.** Never exceed the contract silently. **The diff + validation IS the protocol.**

## Step 3 — Architectural contract diff

Produce (in the user's language):

## Contract diff — addition: [feature name]

### Created files
[list]

### Modified files
[list with nature: added method, added DTO field, added provider…]

### Created/modified contribution points
[command/view/setting list — id in `src/constants.ts` + `contributes` entry in `package.json` (manifest) + handler/provider registration + `activationEvents` impact (normally none — auto-generated)]

### Created test files (if Q4 = Yes)
[mirror list]

### Impact on webview UI
[none | new region/message to respect within `webview-ui.md` and the locked skeleton]

→ Validation required before writing. Update `docs/specs/04-architect.md` once the diff is applied.

## Step 4 — Application — strict rules

- Read `webview-ui.md` (not auto-imported) before any webview UI change.
- Fully respect `@rules/architecture.md`, `@rules/manifest.md`, `@rules/state.md`, `@rules/errors.md`, `@rules/config.md`, `@rules/security.md`, `@rules/webview.md` (if webview), `@rules/sf-cli.md` (if the Salesforce CLI integration is on), `@rules/i18n.md` (if i18n), `@rules/tests.md`, `@rules/versioning.md`, `@rules/verification.md`, `@rules/readme.md`.
- No modification not listed in the validated diff. No opportunistic improvement of adjacent code.
- Implementation across the layers (a new feature usually touches model + controller + view + manifest):
  - Model: business logic / state access via the wrappers (`storage.ts`, `secrets.ts`, `configuration.ts`); raise named errors (`models/errors.ts`) or return `Result<T>`.
  - Command/view id: declare in `src/constants.ts` (never hardcode); add the `contributes` entry in `package.json` (command/view/menu/keybinding with a `when`); register the handler/provider in the controller with **input validation** (`@rules/security.md`); push the disposable into `context.subscriptions`.
  - View: tree provider returns the data and `refresh()`es after a mutation; webview (if any) styled via `--vscode-*` only, CSP + nonce, messages validated.
- sf calls (if any) go through `src/models/sf-cli.ts` (`cross-spawn` args array).
- New user-facing strings → i18n (`package.nls*.json` + `l10n/bundle.l10n*.json`) if enabled, else plain text.
- New visual values (webview) → `--vscode-*` tokens, never hardcoded.
- If the validated diff introduces a deviation from the contract, record it in the extension's `CLAUDE.md` (`## Deviations from the framework`).

## Step 5 — Delivery

Single batch for the feature:

Feature [name] — [N files]

Deliver each created/modified file as a complete block, written to disk. If tests requested: deliver in the same batch, at the end.

## Step 5b — Changelog entry

After the feature is delivered, append an entry under `## [Unreleased]` in the **canonical** `docs/release/CHANGELOG.md` (`@rules/versioning.md`) — **in English**, no version bump:
- `### Added` — the new capability, one concise line (add a `### Changed` line too if it alters existing behavior).
- If the change is backward-incompatible (a command/setting removed, a contribution id renamed, the `engines.vscode` floor raised), mark it `**BREAKING:**` (drives a MAJOR at release).
- Edit **only** the canonical `docs/release/CHANGELOG.md`; do **not** touch the root `CHANGELOG.md` mirror — it is regenerated from the canonical at `/vscode-release`, not per operation.
- If `docs/release/CHANGELOG.md` is absent (extension predates the system), skip silently and suggest `/vscode-load-project` to initialize it.

Do **not** bump the version — that happens at `/vscode-release`. Mention it once, at the end: the change is recorded under `[Unreleased]`; run `/vscode-release` when ready to cut a version.

## Step 6 — Anomaly

If the user reports an anomaly after delivery, apply the `@rules/architecture.md` cleanup protocol then offer `/vscode-save-memory`.

## Anti-patterns — what NOT to do
- **Do not** write anything not listed in the validated diff, or improve adjacent code (that is `/vscode-refactor-code`, on request).
- **Do not** add a command/view without declaring its id in `constants.ts`, adding the `contributes` entry, and registering the handler/provider (+ disposable).
- **Do not** weaken the webview CSP, trust an unvalidated message/arg, or store a secret outside `SecretStorage` — `@rules/security.md` is non-negotiable.
- **Do not** put business logic in a controller or view, or create UI in a model.
- **Do not** call `sf` outside `src/models/sf-cli.ts` or invent a command/flag not in `sf-cli-reference/` — see `@rules/sf-cli.md`.
- **Do not** introduce a library or remote resource not validated in Phase 1 without the deviation protocol.
- **Do not** hardcode a string (i18n) or a visual value (`--vscode-*` tokens in webview).
- **Do not** exceed the contract silently — the diff + validation IS the protocol.

## Verification

Apply `@rules/verification.md` (§A executable + §B static — a failing check is blocking; security checks are not optional). Key points: all created/modified files match the validated diff; contribution ids consistent end-to-end (`src/constants.ts` ↔ `contributes` in `package.json` ↔ registered handlers/providers ↔ `when`-clauses ↔ calls); no import regression (existing files stay functional); if tests, `npm test` exit 0 on the **whole** project. Then apply `@rules/readme.md` — regenerate the README if the change touched a README-documented aspect.

## When the user asks something adjacent
- **"Just make it work, never mind the architecture/security"** → push back: the MVC split and the security rules are what keep an extension safe and maintainable. Implement within them.
- **"Add a whole new view/entity"** → that is a contract extension. Declare the new files/ids/contributions in the diff, validate, then build.
- **"Fix this bug while you're here"** → if outside the current request scope, flag it and switch to `/vscode-fix-issue` rather than bundling an unrelated change.
