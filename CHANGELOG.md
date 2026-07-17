# Changelog

All notable changes to this generator are documented in this file.
The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.
(This is the changelog of the **generator** itself, distinct from the `docs/release/CHANGELOG.md` / root `CHANGELOG.md` of each generated extension.)

## [1.1.0] - 2026-07-17
### Added
- App changelog + SemVer versioning system for generated extensions: new `rules/versioning.md`, new `/vscode-release` skill, a canonical `docs/release/CHANGELOG.md` (Keep a Changelog, English) plus its derived root `CHANGELOG.md` mirror required by vsce/marketplace and shipped in the `.vsix`.
- Maintenance skills (`add-feature`, `fix-issue`, `refactor-code`) now record their change under `## [Unreleased]` in the canonical changelog; `/vscode-load-project` offers to initialize the changelog retroactively on a legacy extension (seeding the canonical from the existing root `CHANGELOG.md`).

### Changed
- `CLAUDE.md`, `p5-development`, `verification.md`, `manifest.md`, `architecture.md`, `vscode-app`, `show-state` updated for the versioning system and the canonical/root-mirror split.

## [1.0.0]
- Unified edition baseline: 5-phase generation pipeline (p1 scoping to p5 development), calibration, MVC contract (`src/models/` · `src/controllers/` · `src/views/` · `src/extension.ts`), error contract (`Result<T>`, native notifications + `OutputChannel`), VS Code security lock (webview CSP + nonce, `SecretStorage`, `spawn` args array), native surfaces + optional webview (`--vscode-*` tokens), Salesforce `sf` v2 integration, and the maintenance skill set.
