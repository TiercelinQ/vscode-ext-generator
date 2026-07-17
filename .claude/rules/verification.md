# Verification rules — single source of truth

> Centralized, reusable verification for the whole framework. Referenced by `/vscode-p5-development`, `/vscode-add-feature`, `/vscode-fix-issue`, and `/vscode-run-tests` — never duplicated in those skills.
> Two parts: **executable verification** (run real commands) and **static integrity** (read the code). Run silently; report only on a discrepancy.

---

## A. Executable verification (run the commands)

When the environment allows it (Node + npm available), these commands are **mandatory** and a failure is **blocking** — do not mark work as done while any of them fails. Run them in order:

```
npm install                  # dependencies resolve
npm run typecheck            # tsc --noEmit — MUST be clean
npm run lint                 # eslint — clean
npm run build                # node esbuild.js --production — produces dist/extension.js
npm test                     # vscode-test — only if tests were enabled (Phase 1)
npm run package              # vsce package — produces the .vsix (last batch / packaging)
```

Rules:
- A non-zero exit or any reported error is a failure → fix the root cause, do not silence the rule. Re-run until clean.
- **`vsce package`** may warn about a missing `repository`, `LICENSE`, or `CHANGELOG` — address or acknowledge; it must still produce the `.vsix`. The root `CHANGELOG.md` (the derived mirror, `@rules/versioning.md`) is what satisfies the CHANGELOG warning and ships in the `.vsix`.
- **Functional smoke** (cannot be a shell command): launch the Extension Development Host (F5) and confirm the extension activates, the contributed commands run, and the views render. State this step explicitly to the user when the env cannot drive it.
- If Node/npm is **not** available in the environment, say so explicitly, fall back to the static checks below, and tell the user which commands they must run themselves before considering the work verified. Never claim a clean typecheck you could not run.
- Quote the relevant command output as proof when reporting completion.
- The generated extension ships a `.claude/settings.json` (deny guards on secrets/artifacts + a `Stop` hook running `npm run lint`). These enforce the rules automatically in later maintenance sessions but **do not replace** this checklist.

---

## B. Static integrity (read the code)

### Every batch / every change
1. TypeScript compiles (`tsc --noEmit` mentally, then confirmed by §A when the env is available).
2. Imports: all used, none missing, unidirectional direction respected (`controllers/views → models`; `constants`/`types` importable by all; models import neither controllers nor views).
3. Layer responsibilities respected (zero business logic in view/controller, zero UI creation in a model). See `@rules/architecture.md` anti-patterns.
4. Zero `// TODO`, zero unjustified empty implementation, zero unjustified `any`.
5. Every disposable (commands, providers, listeners, status bar, OutputChannel) pushed into `context.subscriptions`.
6. No deprecated VS Code API. `engines.vscode` and `@types/vscode` aligned (`@rules/manifest.md`).
7. `@rules/security.md` respected: webview CSP + nonce + `asWebviewUri` (if webview), input validation (messages/args/URIs), secrets only in `SecretStorage`, `spawn` args array for any CLI.
8. Errors: business errors raised/returned in the model, caught in the controller, surfaced via native notifications + `OutputChannel`; no raw throw out of a command handler. See `@rules/errors.md`.

### Last batch only — cross-file
9. Command/view/config ids consistent end-to-end: `src/constants.ts` ↔ `contributes` (`package.json`) ↔ registered handlers ↔ `when`-clauses ↔ calls. No orphan contribution, no handler without a contribution.
10. `activationEvents` minimal (auto-generated; no `"*"`). `main` points to `dist/extension.js`.
11. Architectural contract (`docs/specs/04-architect.md`) respected — every file, command/view id, and library matches the locked contract, or a declared+validated deviation exists.
12. Webview (if any): zero hardcoded color/size, only `--vscode-*` tokens, strict CSP + nonce (`webview-ui.md`); layout from the closed landmark set (`header/nav/main/aside/footer`) via `grid-template-areas`, a single `<main>`, matching the skeleton locked in the Phase 4 contract.
13. i18n keys: all used, none missing — `package.nls*.json` (manifest) + `l10n/bundle.l10n*.json` (runtime), if enabled.
14. `docs/specs/` present and consistent with the delivered code. `.vscodeignore` excludes sources/tests/specs (incl. `docs/**`, so the canonical `docs/release/CHANGELOG.md` never ships — the root `CHANGELOG.md` mirror does).
15. Changelog present in both required forms (`@rules/versioning.md`): the canonical `docs/release/CHANGELOG.md` (Keep a Changelog, English, with `## [Unreleased]`) **and** the derived root `CHANGELOG.md` mirror (released blocks only, no `[Unreleased]`). The top released version of `docs/release/CHANGELOG.md` == `package.json` `"version"` == the top block of the root `CHANGELOG.md` (all three agree).

### Per-domain (conditional — see the matching rule for detail)
- **state** (`@rules/state.md`): keys in `constants.ts`; access via the wrappers; secrets only in `SecretStorage`; change listeners disposed.
- **sf-cli** (`@rules/sf-cli.md`): all calls via `sf-cli.ts` `spawn` args array; `sf` presence detected; no token stored/logged; Org Manager commands validate + refresh.
- **tests** (`@rules/tests.md`): if enabled, `.vscode-test.mjs` present, `pretest` compiles to `out/`, `npm test` exit 0, dev deps present.
- **versioning** (`@rules/versioning.md`): the canonical `docs/release/CHANGELOG.md` present and English; the derived root `CHANGELOG.md` mirror present (released blocks only, no `[Unreleased]`); top released version == `package.json` `"version"` == the root mirror's top block; maintenance changes recorded under `[Unreleased]` in the canonical file only, in the right category; after `/vscode-release`, `[Unreleased]` reset empty, the cut block carries the right version + date, and the root mirror regenerated from the canonical.

---

## C. Reporting

- All clean → one short confirmation line in the user's language (no full recap of the checklist).
- Any discrepancy → name the file, the failing check (§A command output or §B item number), and the fix applied or proposed.
- Verification that could not be run (no Node/npm, or the F5 smoke) → state it plainly and list the steps/commands the user must run.
