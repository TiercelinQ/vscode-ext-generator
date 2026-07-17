# Manifest rules — `package.json` of a VS Code extension

The extension manifest (`package.json`) is the contract between the extension and VS Code: identity, activation, and every contribution point (commands, views, menus, settings, keybindings). It is locked in the Phase 4 architectural contract (`@rules/architecture.md`).

## Identity + engine

```jsonc
{
  "name": "my-extension",              // unique id (publisher.name on the marketplace)
  "displayName": "My Extension",       // human name (localizable via %key%)
  "description": "%extension.description%",
  "version": "1.0.0",
  "publisher": "your-publisher-id",
  "engines": { "vscode": "^1.96.0" },  // conservative floor — set in Phase 1, verify the current version
  "categories": ["Other"],
  "main": "./dist/extension.js",
  "icon": "resources/icon.png",        // 128px+ (if provided in Phase 1)
  "repository": { "type": "git", "url": "" },  // recommended — `vsce package` warns if absent (or pass --allow-missing-repository)
  "l10n": "./l10n"                      // only if i18n enabled — @rules/i18n.md
}
```

- Ship a `LICENSE` file at the project root: `vsce package` warns when none is found. The `repository` field is recommended for the same reason — leave it for the user to fill, or pass `--allow-missing-repository` if there is no remote yet.

- `engines.vscode` policy: **conservative floor** (a version ~6-12 months old) for broad compatibility. Verify the current VS Code version at generation time (release notes / `npm view @types/vscode versions`) and pin the `@types/vscode` dev dependency to **match the floor exactly** (e.g. floor `^1.96.0` → `@types/vscode": "1.96.0"`). The runtime engine floor and the types floor must agree, otherwise you can call an API the floor does not have.
- `version`: semver, starts at `1.0.0`.
- Strings shown to the user in the manifest (`displayName`, `description`, command `title`, config `description`) are localizable via `%key%` placeholders resolved from `package.nls.json` — only when i18n is enabled (`@rules/i18n.md`).

## Activation events

VS Code ≥ 1.74 **auto-generates** activation events from `contributes` (a command contribution implies `onCommand:<id>`, a view implies `onView:<id>`). So:

- Leave `activationEvents` **empty** (`[]` or omit it) when every entry point is a contributed command/view — the generated events cover them.
- Add an explicit event only for a real need: `onLanguage:<id>`, `onFileSystem:<scheme>`, `workspaceContains:<glob>`, `onUri`. Document why in the contract.
- **Never** use `"*"` (activates on every startup — banned). `onStartupFinished` only with a justified, contract-declared reason.

## Contribution points — `contributes`

Declare only what the v1.0 features require. Each id must match `src/constants.ts`.

```jsonc
"contributes": {
  "commands": [
    { "command": "myext.entity.refresh", "title": "%cmd.entity.refresh%", "icon": "$(refresh)", "category": "My Extension" }
  ],
  "viewsContainers": {
    "activitybar": [
      { "id": "myext-container", "title": "My Extension", "icon": "resources/icon.svg" }
    ]
  },
  "views": {
    "myext-container": [
      { "id": "myext.entityView", "name": "%view.entity%", "type": "tree" }
    ]
  },
  "menus": {
    "view/title": [
      { "command": "myext.entity.refresh", "when": "view == myext.entityView", "group": "navigation" }
    ],
    "view/item/context": [
      { "command": "myext.entity.delete", "when": "view == myext.entityView && viewItem == entity", "group": "inline" }
    ],
    "commandPalette": [
      { "command": "myext.entity.delete", "when": "false" }   // hide a context-only command from the palette
    ]
  },
  "configuration": {
    "title": "My Extension",
    "properties": {
      "myext.someSetting": {
        "type": "string", "default": "", "description": "%config.someSetting%", "scope": "window"
      }
    }
  },
  "keybindings": [
    { "command": "myext.entity.refresh", "key": "ctrl+alt+r", "when": "view == myext.entityView" }
  ]
}
```

### Contribution rules
- **Commands**: every `command` id is in `constants.ts` and has a registered handler in a controller. A command shown only in a context menu is hidden from the palette with a `commandPalette` `when: false` entry.
- **`when` clauses**: scope menus/keybindings precisely (`view ==`, `viewItem ==`, custom context keys via `vscode.commands.executeCommand("setContext", ...)`). Never contribute a global keybinding without a `when`.
- **Context values**: a tree item's `contextValue` drives `view/item/context` `when: viewItem == ...`. Keep these values in `constants.ts`.
- **Views**: a sidebar feature contributes a `viewsContainer` (activity-bar icon) + a `view`. Reuse the built-in `explorer`/`scm` containers only when it genuinely belongs there.
- **Webview surface**: the default **WebviewPanel** (editor tab) is opened by a **command** — contribute only a `contributes.commands` entry, **no** `viewsContainer`/`view`. A **WebviewView** (docked in the sidebar) instead contributes a `viewsContainer` + a `view` with `"type": "webview"`, backed by a registered provider (`@rules/webview.md`). **One tab per feature** = multiple `viewType` ids, each panel its own open command; a **hub** webview contributes a **single** command/`viewType` regardless of how many features it hosts (hosting model — `@rules/webview.md`).
- **Configuration**: settings keys are `myext.*`, declared here with `type`/`default`/`description`/`scope`, read through `models/configuration.ts` (`@rules/state.md`). Never read a setting by a hardcoded key elsewhere.
- **Icons in contributions**: `$(codicon-id)` for command icons; a `resources/*.svg` for a view container icon.

## `.vscodeignore`

Exclude everything not needed at runtime from the `.vsix` (sources, tests, specs, configs):

```
.vscode/**
node_modules/**
out/**
.vscode-test/**
src/**
docs/**
.claude/**
**/*.ts
**/*.map
esbuild.js
tsconfig.json
eslint.config.mjs
.vscode-test.mjs
```

Ship `dist/`, `package.json`, `package.nls*.json`, `l10n/`, `media/`, `resources/`, `README.md`, `CHANGELOG.md`, `LICENSE`. The shipped `CHANGELOG.md` is the **root** file — a **derived mirror** (released blocks only) required by vsce/marketplace; the **canonical** changelog is `docs/release/CHANGELOG.md`, which is excluded here (`docs/**`) and never ships. The mirror is regenerated from the canonical at each release (`@rules/versioning.md`). **Exclude `node_modules/**`**: esbuild bundles every dependency into `dist/extension.js`, so shipping `node_modules` would only bloat the `.vsix` with already-bundled code.

## Anti-patterns — what NOT to do

- **Do not** set `activationEvents` to `"*"`, or add `onStartupFinished` without a justified reason — rely on the auto-generated events.
- **Do not** contribute a command without a registered handler, or a handler without a `contributes.commands` entry.
- **Do not** hardcode a command/view/config id that diverges from `src/constants.ts`.
- **Do not** ship a global keybinding or a context menu without a `when` clause.
- **Do not** mismatch `engines.vscode` and `@types/vscode` — both pinned to the same conservative floor.
- **Do not** bundle sources/tests/specs into the `.vsix` — keep `.vscodeignore` tight.

## Integrity verification

Detailed in `@rules/verification.md`. Key points: `activationEvents` minimal and auto-generated (never `"*"`); every `contributes.commands` entry has a registered handler and every handler has its contribution; command/view/config ids match `src/constants.ts`; keybindings and menus carry a `when` clause; `engines.vscode` and `@types/vscode` pinned to the same conservative floor; `main` = `dist/extension.js` and `.vscodeignore` excludes sources/tests/specs.
