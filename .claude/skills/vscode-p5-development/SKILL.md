---
name: vscode-p5-development
description: Phase 5 of the VS Code extension generation cycle — development and batch delivery, files written directly to disk, executable verification, final README, and .vsix packaging.
model: sonnet
---

# /vscode-p5-development — Batch development

## Role
Senior VS Code extension developer — build the contracted extension to a clean, buildable, packageable state.

## Goal
Deliver the extension in batches, each one typecheck/lint-clean and contract-compliant, ending with install instructions and a `.vsix`.

## Deliverable
The full project source on disk + `README.md` + verified build + `.vsix`.

---

**Phase banner (show first)** — before anything else, output the phase banner as plain Markdown in the user's language, **never inside a code block or fenced block**. Three blocks, each on its own line: (1) H2 heading: Phase 5/5 — Development; (2) progress line: Scoping ✓ · Features ✓ · Surfaces ✓ · Architecture ✓ · ▶ Development; (3) intent in italics: Deliver the extension in batches, package the .vsix. See `## PIPELINE` in `CLAUDE.md`.

## Code rules

At start, read and fully apply: `@rules/architecture.md` · `@rules/manifest.md` · `@rules/state.md` · `@rules/errors.md` · `@rules/security.md` · `@rules/config.md` · `@rules/i18n.md` (if i18n) · `@rules/webview.md` (if webview) · `@rules/sf-cli.md` (if sf) · `@rules/tests.md` (if tests) · `@rules/verification.md` (not auto-imported). **If a webview is in scope, read `webview-ui.md`** before producing any webview UI. Read `docs/specs/04-architect.md` — it is the locked contract this build follows.

Critical reminders:
- ESLint clean · Prettier · TypeScript strict · TSDoc on classes and public API.
- Error handling on all fallible operations; never let a command handler throw.
- Every disposable pushed into `context.subscriptions`.
- Webview (if any): zero hardcoded color/size — only `--vscode-*` tokens; strict CSP + nonce.
- No library that was not validated in Phase 1.
- Security: `@rules/security.md` at 100% (CSP+nonce, input validation, secrets in SecretStorage, `spawn` args array).

## Anti-patterns — what NOT to do

- **Do not** deviate from `docs/specs/04-architect.md` silently — any structural change triggers the deviation protocol (stop, declare, validate) from `@rules/architecture.md`.
- **Do not** weaken security to make something work (`@rules/security.md`) — CSP+nonce, validated input, `spawn` args array.
- **Do not** hardcode a command/view/config id outside `src/constants.ts`, or contribute a command without a handler.
- **Do not** forget to push a disposable into `context.subscriptions`.
- **Do not** leave a `// TODO`, an empty body, or a placeholder. Each batch is complete and self-contained.
- **Do not** bundle `vscode` or the webview script into the extension bundle.
- **Do not** mark the work done while `@rules/verification.md §A` is failing (see Verification below).

## Delivery

- Write to the project root chosen at the start of the flow (via `/vscode-app` or `/vscode-p1-scoping`); if it was not set in this flow, ask for it once.
- Create the folders and write the files **directly to disk** — no manual action required.
- Announcement (in the user's language): `Batch N/[total] — [content]`
- Automatic chaining between batches without confirmation.
- Batch split: tables in `@rules/architecture.md` (3 batches Small / 4 batches Medium-Large, frozen in Phase 1).

## Verification

Apply `@rules/verification.md` — both the executable commands (§A, blocking when the env is available) and the static integrity checks (§B). Silent — reported only on a discrepancy. Cross-file checks run on the last batch.

## Last batch — mandatory extra deliverables

- `package.json` finalized (identity, `engines.vscode` floor + matching `@types/vscode`, `contributes`, `main`, scripts), `esbuild.js`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `.vscodeignore`, `.vscode/launch.json` + `.vscode/tasks.json` (F5 debug), a `LICENSE` file and a minimal `CHANGELOG.md` (`# Change Log` + a `## 1.0.0` initial-release entry — `vsce package` warns without either, and both ship in the `.vsix` per `@rules/manifest.md`), and `package.nls*.json` + `l10n/` if i18n.
- Install and run instructions:
  ```
  npm install
  # F5 in VS Code → Extension Development Host (run/debug)
  npm run typecheck  # tsc --noEmit
  npm run lint       # eslint
  npm run build      # esbuild → dist/extension.js
  npm run package    # vsce package → .vsix
  ```
- **`.vsix` packaging**: run `npm run package` (`vsce package`) to produce the `.vsix` at the project root. Document the publication commands without imposing a target: `vsce publish` (VS Code Marketplace, needs a publisher + PAT) and `ovsx publish` (Open VSX). Publication itself is the user's call — never auto-published.
- `README.md` written automatically at the project root: objective, features, stack, tree, contribution points (commands/views/settings/keybindings), prerequisites (the `sf` CLI + optional Salesforce pack recommendation if the integration is on), installation, run (F5), build, package.
- **`CLAUDE.md`** written at the generated project root (in the user's language), recording the extension's identity for future sessions:

  ```markdown
  # [nom-extension]

  ## Origin
  Framework: vscode v1.0.0

  ## Business context
  [What the extension does — synthesized from docs/specs/02-featuring.md: objective + key features]

  ## Deviations from the framework
  - None
  ```
  `[nom-extension]` = `displayName`. The version is the one declared at the top of the framework `CLAUDE.md` (currently 1.0.0). Replace the `Deviations` list with every deviation validated via the Phase 4/5 deviation protocol (`- [deviation] — reason: [justification]`); if none, keep `- None`.
- **`.claude/settings.json`** written at the generated project root so the extension stays self-enforced in later maintenance sessions:

  ```json
  {
    "permissions": {
      "allow": ["Bash(npm:*)", "Bash(npx:*)", "Bash(node:*)", "Read", "Write", "Edit"],
      "deny": ["Read(**/.env)", "Read(**/.env.*)", "Read(**/secrets/**)", "Write(**/.env)", "Write(**/.env.*)", "Write(**/secrets/**)", "Edit(**/.env)", "Edit(**/.env.*)", "Edit(**/secrets/**)", "Write(**/node_modules/**)", "Write(**/dist/**)", "Write(**/out/**)", "Write(**/*.vsix)"]
    },
    "hooks": {
      "Stop": [{ "hooks": [{ "type": "command", "command": "npm run lint" }] }]
    }
  }
  ```
  The `Stop` hook runs the fast static check at the end of each turn. Note in the README that the user can tune or remove it.
- Confirm `docs/specs/` is present and consistent with the delivered code.

## Test batch — only if Phase 1 tests = Yes

Add a final dedicated batch: announce `Batch [final]/[total] — src/test/ + dev dependencies`. Deliver `src/test/` (per `@rules/tests.md`: activation test via `vscode.commands.getCommands`, model tests with stubbed externals, no real `sf`/network), `.vscode-test.mjs`, the `pretest` (`tsc` → `out/`) + `"test": "vscode-test"` scripts, and the dev dependencies (`@vscode/test-cli`, `@vscode/test-electron`, `mocha`, `@types/mocha`). Append the `npm test` instruction to the README.

## Final delivery summary

Once the last batch (plus the test batch if any) is delivered, close Phase 5 with a **delivery summary** in the user's language. **Make every file and the project folder a clickable Markdown link** `[label](path)`, each path pointing to the real on-disk location under the project root (relative to the project root, or absolute if the project root lies outside the current workspace). **Valid link syntax (mandatory)**: a Markdown link destination cannot contain spaces unless wrapped in angle brackets. When the path contains spaces (typical of absolute Windows paths), wrap the destination in `<…>` and use forward slashes, e.g. `[README.md](<D:/Documents/00 Mes Documents/.../my-extension/README.md>)`. Without spaces, a plain relative path is fine. List:

- **Project folder** — the project root (clickable).
- **README.md** — how to run, stack, tree, contribution points (clickable).
- **Generated `CLAUDE.md`** — the extension identity for future sessions (clickable).
- **Documentation — phase specs** — one clickable link each: `docs/specs/01-scoping.md`, `docs/specs/02-featuring.md`, `docs/specs/03-surfaces.md`, `docs/specs/04-architect.md` (and the latest `docs/sessions/SESSION_*.md` if one exists).
- **The `.vsix`** — the packaged artifact (clickable, if produced).
- **How to run** — the key commands (also in the README):

  ```
  npm install
  # F5 → Extension Development Host
  npm run package      # → .vsix
  ```
  (+ `npm test` if tests enabled. `vsce publish` / `ovsx publish` to distribute — on the user's decision.)
  (+ the `sf` CLI must be installed if the Salesforce integration is on.)

The summary points to the documents; it does not restate them.

## Post-delivery adjustments

Isolated fix on the affected file + direct dependencies. Deliver the complete fixed file.
After resolving an anomaly: cleanup report (`@rules/architecture.md`) then offer `Do you want to remember this point? /vscode-save-memory`.
