# Architecture rules — VS Code extension (MVC)

## MVC → VS Code mapping

| Layer            | Location              | Content                                                        |
| ---------------- | --------------------- | -------------------------------------------------------------- |
| Model            | `src/models/`         | Domain logic, state/persistence wrappers, external integrations (CLI/HTTP) |
| Controller       | `src/controllers/`    | Command handlers, event handlers, webview message router        |
| View             | `src/views/`          | `TreeDataProvider`, status bar items, quick pick builders, webview UI |
| Composition root | `src/extension.ts`    | `activate()` / `deactivate()` — instantiates and registers everything |
| Shared           | `src/constants.ts`, `src/types.ts` | IDs (commands/views/config keys), `Result<T>`, DTOs, webview message union |

## Responsibilities

### Models — `src/models/`
- Pure Node.js + TypeScript. Classes or modules per entity.
- Persistence wrappers: `storage.ts` (Memento global/workspace), `secrets.ts` (`SecretStorage`), `configuration.ts` (settings reader). All state access goes through these — see `@rules/state.md`.
- External integrations: e.g. `sf-cli.ts` for the Salesforce CLI (`@rules/sf-cli.md`).
- Raise named business errors (`models/errors.ts`).
- **Forbidden**: registering commands, creating UI (`window.createTreeView`, `createWebviewPanel`, `createStatusBarItem`), or touching `vscode.commands`. Tolerated: `vscode.workspace`/`SecretStorage`/`Memento` via the wrappers, `vscode.Uri`, `vscode.l10n.t`.
- **Forbidden**: any import from `controllers/` or `views/`.

### Controllers — `src/controllers/`
- One file per entity: `[entity].controller.ts`. Plus `controllers/index.ts` exporting `registerAll(context, deps)`.
- Register `vscode.commands.registerCommand(...)` handlers and event listeners.
- Validate every external input (command arg, webview message, user input) before calling the Model — see `@rules/security.md`.
- Catch business errors and surface them as native notifications (see `@rules/errors.md`). **Never let a raw exception escape a command handler.**
- Route webview messages (`onDidReceiveMessage`) to the right model call, post results back.
- **Forbidden**: business logic, direct persistence (use the model wrappers), building HTML.

### Views — `src/views/`
- `TreeDataProvider` implementations (`[entity]-tree.ts`), status bar items (`status-bar.ts`), quick pick builders, and webview providers (`[entity]-webview.ts` + `webview/` HTML builder).
- A tree/webview provider reads its data through the **models**; it exposes a `refresh()` (fires `onDidChangeTreeData`) that controllers call after a mutation.
- No business logic. No direct persistence. Webview HTML follows `webview-ui.md` (`--vscode-*` tokens, CSP + nonce, region skeleton).
- **Multiple webviews**: when an extension ships more than one webview, namespace per webview — `src/views/webview/<name>/html.ts` + `media/<name>/main.css` + `media/<name>/main.ts`, with one `viewType` id and (for a panel) one open command each. A single webview keeps the flat `src/views/webview/html.ts` + `media/main.*`. Each webview's region map / skeleton is locked in the Phase 4 contract (`webview-ui.md` Panel layout). Each added webview counts toward sizing (`## CALIBRATION` in `CLAUDE.md`).
- **Hosting model** (decided in Phase 3, locked in Phase 4 — `@rules/webview.md`): this namespacing is the **one-tab-per-feature** model (each feature its own webview). A **hub** (one webview hosting several feature views via the internal `<nav>`) keeps the single flat `src/views/webview/html.ts` + `media/main.*` regardless of feature count. Sizing: one tab per feature counts each webview; a hub counts as one.

## Unidirectional imports

```
extension.ts (composition root)
   ├─▶ models/      (instantiate)
   ├─▶ controllers/ (registerAll, given models + views)
   └─▶ views/       (register providers, given models)

controllers ──▶ models
views ──▶ models (read only)
constants.ts / types.ts ◀── importable by all layers
```

- `constants.ts` holds every command id, view id, view container id, and config key as `as const` — **zero hardcoded id string** elsewhere (the VS Code analogue of `ipc-channels.ts`).
- `types.ts` holds `Result<T>`, the DTOs, and the webview message union — zero logic.
- One entity = one model + one controller + one view (tree/webview) at most. Shared constants in `src/constants.ts`.

## `Result<T>` contract

```ts
// src/types.ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: "warning" | "error"; message: string; detail?: string } };
```

Models return `Result<T>` (or throw a named error caught by the controller); controllers map failures to `window.showErrorMessage` / `showWarningMessage`. See `@rules/errors.md`.

## Generated reference tree

```
my-extension/
├── package.json                  # manifest: engines.vscode, contributes, activationEvents, scripts — @rules/manifest.md
├── package.nls.json              # manifest i18n strings (if i18n) — package.nls.fr.json … — @rules/i18n.md
├── tsconfig.json
├── eslint.config.mjs · .prettierrc
├── esbuild.js                    # bundler → dist/extension.js — @rules/config.md
├── .vscodeignore                 # files excluded from the .vsix
├── .vscode/
│   ├── launch.json               # F5 → Extension Development Host
│   └── tasks.json                # esbuild watch task
├── README.md
├── CHANGELOG.md
├── l10n/                         # bundle.l10n.json runtime strings (if i18n) — @rules/i18n.md
├── media/                        # webview assets (if webview): main.css, main.js, codicon.css
├── resources/                    # extension icon (128px png)
├── docs/specs/                   # generation specs (user's language): 01-scoping … 04-architect
└── src/
    ├── extension.ts              # activate()/deactivate() — composition root
    ├── constants.ts              # command ids, view ids, config keys (as const)
    ├── types.ts                  # Result<T>, DTOs, webview message union
    ├── models/
    │   ├── errors.ts             # named business errors
    │   ├── storage.ts            # Memento wrapper (global/workspace) — @rules/state.md
    │   ├── secrets.ts            # SecretStorage wrapper — @rules/state.md
    │   ├── configuration.ts      # settings reader — @rules/state.md
    │   ├── sf-cli.ts             # sf runner + typed helpers (if sf) — @rules/sf-cli.md
    │   └── [entity].model.ts
    ├── controllers/
    │   ├── index.ts              # registerAll(context, deps)
    │   └── [entity].controller.ts
    └── views/
        ├── [entity]-tree.ts      # TreeDataProvider
        ├── status-bar.ts         # status bar items (if any)
        ├── [entity]-webview.ts   # WebviewView/Panel provider (if webview)
        └── webview/
            └── html.ts           # HTML builder: regions/skeleton + CSP + nonce, asWebviewUri — webview-ui.md
                                   #   (multiple webviews: src/views/webview/<name>/html.ts + media/<name>/ — see below)
```

## `activate()` sequence (non-negotiable)

```ts
export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel("[Ext Name]", { log: true });
  // 1. models
  const storage = new Storage(context);
  const entityModel = new EntityModel(storage);
  // 2. views (providers)
  const entityTree = new EntityTreeProvider(entityModel);
  // 3. controllers (register commands + listeners + webview routing)
  registerAll(context, { output, entityModel, entityTree });
  // 4. register providers, push every disposable
  context.subscriptions.push(
    output,
    vscode.window.registerTreeDataProvider(VIEW.ENTITY, entityTree),
  );
}
export function deactivate(): void {}
```

- Every disposable (commands, providers, listeners, status bar, OutputChannel) goes into `context.subscriptions`.
- Activation is lazy: `activationEvents` are auto-generated from `contributes` (VS Code ≥ 1.74). Do not add `"*"`.

## Batch delivery

**Small project (3 batches):**

| Batch | Content                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------- |
| 1     | `src/constants.ts` + `src/types.ts` + `src/models/` (storage, secrets, configuration, errors, entity models, `sf-cli.ts` if enabled) |
| 2     | `src/controllers/` + `src/views/` (tree, status bar, webview provider + `media/` if webview)       |
| 3     | `src/extension.ts` + `package.json` (manifest/contributes) + `esbuild.js` + tsconfig + eslint + `.vscode/` + `.vscodeignore` + `l10n`/`nls` (if i18n) + README + `CLAUDE.md` + `.claude/settings.json` + packaging instructions |

**Medium / Large project (4 batches):**

| Batch | Content                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------- |
| 1     | `src/constants.ts` + `src/types.ts` + `src/models/`                                                |
| 2     | `src/views/`                                                                                        |
| 3     | `src/controllers/`                                                                                  |
| 4     | `src/extension.ts` + `package.json` + `esbuild.js` + configs + `.vscode/` + `l10n`/`nls` (if i18n) + README + `CLAUDE.md` + `.claude/settings.json` + packaging |

### Tests batch (only if Phase 1 tests = Yes)
Add a final dedicated batch — `src/test/` (`@vscode/test-cli` + Mocha) + `.vscode-test.mjs` + dev dependencies + the `"test"` script. → Small 4 batches / Medium-Large 5 batches. Patterns: `@rules/tests.md`.

### Delivery format
- Announcement: `Batch N/[total] — [content]`
- Files written directly to disk, complete and self-contained blocks.
- Automatic chaining between batches without confirmation.
- Last batch: install/run instructions (`npm install`, F5, `npm run typecheck`, `npm run lint`, `npm run build`, `vsce package`) + `README.md` at the root.

## Integrity verification

Per-batch and cross-file integrity checks (layer responsibilities, unidirectional imports, command/view ids consistent end-to-end, disposables registered, contract) live in **`@rules/verification.md`** — the single source of truth for verification. Run them silently every batch; report only on a discrepancy. Cross-file checks run on the last batch.

## Anti-patterns — what NOT to do

- **Do not** create UI (`createTreeView`, `createWebviewPanel`, `createStatusBarItem`) or register a command inside a model. Models are framework-light Node + the VS Code state wrappers.
- **Do not** put business logic in a controller or a view. Controllers validate + dispatch; views render. Logic lives in models.
- **Do not** hardcode a command id, view id, or config key outside `src/constants.ts`.
- **Do not** import `controllers/` or `views/` from a model.
- **Do not** forget to push a disposable into `context.subscriptions` — it leaks across reloads.
- **Do not** spread one entity across more files than `model + controller + view`. If it grows, that is a contract change → declare the deviation (Phase 4 protocol).
- **Do not** put a shared id/constant in only one layer — promote it to `src/constants.ts`.

## Anomaly resolution — cleanup protocol

When an anomaly requires several attempts before being resolved, as soon as the definitive solution is identified and delivered, produce a mandatory cleanup report:

```
Anomaly resolved. Elements to remove from the previous attempts:

File [name]:
- [line / block / import / command id / disposable / CSS rule to delete]
- ...
```

- List only the elements added during the failed attempts that are no longer needed.
- Cover all affected files: TS, manifest (`package.json` contributes), webview assets, configs.
- Deliver the complete cleaned files if the user confirms.
- Then offer: "Do you want to remember this point? `/vscode-save-memory`"

## Deletions

Total deletion across all files: code, imports, command/view ids (declaration in `constants.ts` + `contributes` block + handler + calls), types, webview message variants, CSS rules, i18n keys (`package.nls.json` + `bundle.l10n.json`). Forbidden: commented-out code, empty implementations, residue. Deliver the complete modified files.
