---
name: vscode-add-feature
description: Add a feature, command, view, entity, or change to a VS Code extension already delivered by this framework. Use when the user asks to add or modify functionality on an existing project, respecting the locked architectural contract and the security rules.
model: sonnet
---

# /vscode-add-feature — Add a feature to a delivered extension

## Role
Senior VS Code extension developer working on an existing, contracted codebase.

## Goal
Implement the requested change end-to-end (model → controller → view + manifest), contract-compliant, secure, typecheck-clean, without scope creep.

## Deliverable
The modified/added files on disk + an updated `docs/specs/04-architect.md` if the structure changed + verified build.

---

> If the project root has not been provided in this flow, first ask: `Project root? (folder path)`.

## Steps

1. **Load context**: read `docs/specs/04-architect.md` (locked contract), then `@rules/architecture.md` · `@rules/manifest.md` · `@rules/state.md` · `@rules/errors.md` · `@rules/security.md` · `@rules/config.md` · `@rules/webview.md` (if webview) · `@rules/sf-cli.md` (if sf) · `@rules/verification.md` (not auto-imported). Read `webview-ui.md` on demand before any webview UI change.

2. **State assumptions** before coding. If the request is ambiguous (which entity, which surface, business rule), ask — closed questions via `AskUserQuestion` (clickable options, recommended first); free-form text only for non-enumerable details.

3. **Decide: within contract OR deviation.**
   - **Within contract** — the change fits the existing tree (new method on a model, new field on a DTO, new item in an existing tree view): implement directly.
   - **Deviation** — the change needs a new file, command/view id, contribution point, or library: **stop, declare the deviation + justification, wait for validation** (the Phase 4 protocol). Only then implement and update `docs/specs/04-architect.md`.

4. **Implement across the layers** (a new feature usually touches model + controller + view + manifest):
   - Model: business logic / state access via the wrappers; raise named errors (`models/errors.ts`).
   - Command/view id: declare in `src/constants.ts` (never hardcode); add the `contributes` entry in `package.json` (command/view/menu/keybinding with a `when`); register the handler/provider in the controller with **input validation** (`@rules/security.md`); push the disposable into `context.subscriptions`.
   - View: tree provider returns the data and `refresh()`es after a mutation; webview (if any) styled via `--vscode-*` only, CSP + nonce, messages validated.
   - New user-facing strings → i18n (`package.nls*.json` / `l10n/bundle.l10n*.json`) if enabled, else plain text.
   - sf calls (if any) go through `src/models/sf-cli.ts` (`spawn` args array).

5. **Verify**: apply `@rules/verification.md` (§A executable + §B static). A failing check is blocking. Security checks are not optional.

6. **Update the contract spec** if structure changed; if a deviation was validated, record it in the extension's `CLAUDE.md` (`## Deviations from the framework`); apply `@rules/readme.md` — if the change touched a README-documented aspect, regenerate the README in the same delivery.

## Anti-patterns — what NOT to do
- **Do not** touch code outside the request. Minimum change; no opportunistic refactor (that is `/vscode-refactor-code`, on request).
- **Do not** add a command/view without declaring its id in `constants.ts`, adding the `contributes` entry, and registering the handler/provider (+ disposable).
- **Do not** weaken the webview CSP, trust an unvalidated message/arg, or store a secret outside `SecretStorage` — `@rules/security.md` is non-negotiable.
- **Do not** put business logic in a controller or view, or create UI in a model.
- **Do not** introduce a library or remote resource not validated in Phase 1 without the deviation protocol.
- **Do not** hardcode a string (i18n) or a visual value (`--vscode-*` tokens in webview).
- **Do not** silently exceed the contract — declare and validate first.

## When the user asks something adjacent
- **"Just make it work, never mind the architecture/security"** → push back: the MVC split and the security rules are what keep an extension safe and maintainable. Implement within them.
- **"Add a whole new view/entity"** → that is a contract extension. Declare the new files/ids/contributions, validate, then build.
- **"Fix this bug while you're here"** → if outside the current request scope, flag it and switch to `/vscode-fix-issue` rather than bundling an unrelated change.
