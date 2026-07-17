# Versioning & changelog rules — VS Code extension

> The generated extension keeps a human-readable changelog and a SemVer version. This rule defines the changelog format, where the version lives, how each maintenance operation feeds the changelog, and how `/vscode-release` cuts a version. It also defines the **canonical vs mirror** split forced by vsce/marketplace. Referenced by `/vscode-p5-development`, `/vscode-add-feature`, `/vscode-fix-issue`, `/vscode-refactor-code`, `/vscode-load-project`, and `/vscode-release`.

## Two changelog files — canonical + derived mirror

VS Code extensions have a hard constraint: `vsce` warns without a `CHANGELOG.md` at the extension **root**, and the marketplace page renders that root file. But `.vscodeignore` excludes `docs/**`, so a changelog under `docs/` never ships in the `.vsix`. Hence two files with distinct roles:

| File | Role | Contains `[Unreleased]`? | Ships in the `.vsix`? |
| ---- | ---- | ------------------------ | --------------------- |
| **`docs/release/CHANGELOG.md`** | **Canonical** working source of truth. Accumulates pending entries. | Yes | No (`docs/**` excluded) |
| **`CHANGELOG.md`** (extension root) | **Derived mirror** required by vsce/marketplace. Released versions only. | No | Yes |

- The **canonical** file (`docs/release/CHANGELOG.md`, create `docs/release/` if absent) is where entries accumulate and where `/vscode-release` cuts a version. It is the single source of truth for the release history.
- The **root mirror** (`CHANGELOG.md`) is **regenerated from the canonical** at every release: the same released blocks, **without** the `## [Unreleased]` section (a marketplace changelog only shows released versions). Never hand-edit the mirror — it is derived output.
- **Written in English**, both files, regardless of the user's language — the changelog is a deploy artifact and the marketplace page is public. (Specs and README stay in the user's language; the changelog does not.)
- Format: **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)** + **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)** for both files.

Canonical seed written at generation (Phase 5), `docs/release/CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this project are documented in this file.
The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

## [1.0.0] - <YYYY-MM-DD>
### Added
- Initial release.
```

Derived root mirror written at generation (Phase 5), `CHANGELOG.md` — same released blocks, no `[Unreleased]`:

```markdown
# Change Log

All notable changes to this extension are documented in this file.
The format is based on Keep a Changelog, and this extension adheres to Semantic Versioning.

## [1.0.0] - <YYYY-MM-DD>
### Added
- Initial release.
```

## Entry categories

Under `## [Unreleased]` in the **canonical** file, group entries in these sections (Keep a Changelog), in this order, omitting empty ones:

- `### Added` — a new feature/capability (backward compatible).
- `### Changed` — a change to existing behavior, an internal refactor.
- `### Fixed` — a bug fix.
- `### Removed` — a removed feature/capability.
- `### Security` — a security fix.

A **breaking change** (incompatible with the previous version) is marked with a leading `**BREAKING:**` in its entry (usually under `Changed` or `Removed`). This marker drives the MAJOR inference at release.

## Version source — single source + mirror

- **Canonical version**: `package.json` `"version"`. This is what VS Code, `vsce`, and the marketplace read.
- **Mirror**: the top released block of the root `CHANGELOG.md` — regenerated from the canonical `docs/release/CHANGELOG.md` at release, so its top version always equals `package.json` `"version"`.
- The version at the **top released block** of `docs/release/CHANGELOG.md` must match `package.json` `"version"`. Between releases, `[Unreleased]` sits above it in the canonical file (never in the mirror) and carries the pending entries.
- `/vscode-release` writes both — `package.json` `"version"` and the regenerated root mirror; verification asserts the three-way equality (`@rules/verification.md`): top canonical released version == `package.json` `"version"` == top block of the root mirror.

## SemVer mapping (per maintenance operation)

Operations **accumulate** entries under `[Unreleased]` in the canonical file — they do **not** bump the version and do **not** touch the root mirror (the mirror is regenerated only at `/vscode-release`). The bump happens once, at `/vscode-release`. The mapping below is what each operation contributes, and what the release inference reads:

| Operation | Changelog section | Release effect |
| --------- | ----------------- | -------------- |
| `add-feature` | `Added` (+ `Changed` if it alters existing behavior) | MINOR |
| `fix-issue` | `Fixed` | PATCH |
| `refactor-code` | `Changed` (internal) | PATCH |
| breaking change (any op) | `**BREAKING:**` marker (`Changed`/`Removed`) | MAJOR |

## Release inference (`/vscode-release`)

From the accumulated `[Unreleased]` entries in the canonical file, infer the increment:

1. Any `**BREAKING:**` marker or a `Removed` entry → **MAJOR**.
2. Else any `Added` entry → **MINOR**.
3. Else (only `Fixed` / internal `Changed`) → **PATCH**.

The inferred increment is **proposed** to the user (`AskUserQuestion`, inferred option preselected as recommended); the user can override — notably to force a MAJOR the inference cannot detect. MAJOR is never applied silently.

### What counts as breaking (MAJOR) for a VS Code extension

- A **command** or a **setting** removed that a user relied on.
- A **contribution id** (command / view / view container / config key) renamed that users relied on (a keybinding, a `tasks.json`, a settings entry breaks).
- Raising the `engines.vscode` floor (drops users on older VS Code versions).
- A stored-state / secret format change that requires manual user action.
- Removing a webview command or a documented external entry point (URI handler).

## Anti-patterns — what NOT to do

- **Do not** treat the root `CHANGELOG.md` as the source of truth — it is a **derived mirror**; edit the canonical `docs/release/CHANGELOG.md` and regenerate the mirror at release.
- **Do not** hand-edit the root mirror or add an `[Unreleased]` section to it — the marketplace shows released versions only.
- **Do not** put the canonical changelog at the project root, or drop the `docs/release/` one — it lives in `docs/release/CHANGELOG.md`.
- **Do not** write the changelog in the user's language — English only (both files).
- **Do not** bump `package.json` `"version"` in a maintenance operation — only `/vscode-release` bumps.
- **Do not** regenerate the root mirror in a maintenance operation — the mirror moves only at `/vscode-release`.
- **Do not** apply a MAJOR bump without explicit user confirmation.
- **Do not** leave stale entries under `[Unreleased]` after a release — they move into the cut version block, and `[Unreleased]` is reset empty.

## Integrity verification

Detailed in `@rules/verification.md`. Key points: `docs/release/CHANGELOG.md` present and Keep a Changelog-shaped (English); the root `CHANGELOG.md` present as its derived mirror (released blocks only, no `[Unreleased]`); the top released version of `docs/release/CHANGELOG.md` == `package.json` `"version"` == the top block of the root `CHANGELOG.md` (all three equal); every maintenance change added an `[Unreleased]` entry in the right category (no silent change); after a release, `[Unreleased]` is reset empty, the cut block carries the correct version + date, and the root mirror was regenerated from the canonical.
