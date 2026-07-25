# Changelog

All notable changes to this generator are documented in this file.
The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.
(This is the changelog of the **generator** itself, distinct from the `docs/release/CHANGELOG.md` / root `CHANGELOG.md` of each generated extension.)

## [1.3.0] - 2026-07-25
### Added
- Generated extensions now ship a root `.gitignore` template (socle + VS Code build additions `node_modules/`, `/out/`, `/dist/`, `*.vsix`): new `## .gitignore` section in `rules/config.md`, wired into the `rules/architecture.md` tree and batch tables, the `p5-development` last-batch deliverables, and `rules/verification.md` (new cross-file check). Keeps `.vscode/` (F5 launch/tasks) and the root `CHANGELOG.md` mirror committed; kept distinct from `.vscodeignore`.
- README language requirement made explicit: the generated `README.md` is always English (public-facing Marketplace document, alongside the changelog) — new `## Language — English` section in `rules/readme.md` + the write step in `vscode-generate-readme`.

### Changed
- `rules/versioning.md`: corrected the language note now that the README is English (Specs stay in the user's language; the README and the changelog are English).

## [1.2.0] - 2026-07-18
### Added
- Webview data tables: columns are sortable ascending and descending (`<th>` click, `aria-sort`, codicon chevron indicator).
- Post-delivery reminder: the Phase 5 delivery summary and the generated extension `CLAUDE.md` now list the maintenance commands and `/vscode-release`.

### Changed
- Webview nav/aside labels word-wrap within the column instead of truncating.
- Phase 1 Salesforce CLI question is shown only when the objective mentions Salesforce (otherwise off, still enabled on explicit request).

## [1.1.0] - 2026-07-17
### Added
- App changelog + SemVer versioning system for generated extensions: new `rules/versioning.md`, new `/vscode-release` skill, a canonical `docs/release/CHANGELOG.md` (Keep a Changelog, English) plus its derived root `CHANGELOG.md` mirror required by vsce/marketplace and shipped in the `.vsix`.
- Maintenance skills (`add-feature`, `fix-issue`, `refactor-code`) now record their change under `## [Unreleased]` in the canonical changelog; `/vscode-load-project` offers to initialize the changelog retroactively on a legacy extension (seeding the canonical from the existing root `CHANGELOG.md`).

### Changed
- `CLAUDE.md`, `p5-development`, `verification.md`, `manifest.md`, `architecture.md`, `vscode-app`, `show-state` updated for the versioning system and the canonical/root-mirror split.

## [1.0.0]
- Unified edition baseline: 5-phase generation pipeline (p1 scoping to p5 development), calibration, MVC contract (`src/models/` · `src/controllers/` · `src/views/` · `src/extension.ts`), error contract (`Result<T>`, native notifications + `OutputChannel`), VS Code security lock (webview CSP + nonce, `SecretStorage`, `spawn` args array), native surfaces + optional webview (`--vscode-*` tokens), Salesforce `sf` v2 integration, and the maintenance skill set.
