# State & persistence rules — VS Code extension

The extension stores state only through the native VS Code APIs. No database, no preferences file. Three stores, one typed wrapper each, all under `src/models/`.

| Store | API | Wrapper | Use for |
| ----- | --- | ------- | ------- |
| Global state | `context.globalState` (Memento) | `models/storage.ts` | small key/value state shared across all workspaces (last selection, flags) |
| Workspace state | `context.workspaceState` (Memento) | `models/storage.ts` | small key/value state scoped to the current workspace |
| Secrets | `context.secrets` (`SecretStorage`) | `models/secrets.ts` | tokens, passwords — OS keychain, encrypted |
| Settings | `vscode.workspace.getConfiguration` | `models/configuration.ts` | user-facing options declared in `contributes.configuration` |

All keys are declared in `src/constants.ts` (`as const`). Zero scattered `context.globalState.get("...")` with a raw string.

## Memento wrapper — `models/storage.ts`

```ts
import * as vscode from "vscode";
import { STATE_KEYS } from "../constants";

export class Storage {
  constructor(private readonly ctx: vscode.ExtensionContext) {}

  getGlobal<T>(key: keyof typeof STATE_KEYS, fallback: T): T {
    return this.ctx.globalState.get<T>(STATE_KEYS[key], fallback);
  }
  async setGlobal<T>(key: keyof typeof STATE_KEYS, value: T): Promise<void> {
    await this.ctx.globalState.update(STATE_KEYS[key], value);
  }
  getWorkspace<T>(key: keyof typeof STATE_KEYS, fallback: T): T {
    return this.ctx.workspaceState.get<T>(STATE_KEYS[key], fallback);
  }
  async setWorkspace<T>(key: keyof typeof STATE_KEYS, value: T): Promise<void> {
    await this.ctx.workspaceState.update(STATE_KEYS[key], value);
  }
}
```

- Memento is **small key/value only** — never store large datasets, blobs, or a whole list of records. For larger structured data, write a JSON file under `context.globalStorageUri` / `context.storageUri` (created on demand) via `vscode.workspace.fs`.
- `update(key, undefined)` removes a key.
- Call `context.globalState.setKeysForSync([...])` only for keys that should follow Settings Sync.

## Secrets wrapper — `models/secrets.ts`

```ts
export class Secrets {
  constructor(private readonly secrets: vscode.SecretStorage) {}
  get(key: string): Thenable<string | undefined> { return this.secrets.get(key); }
  store(key: string, value: string): Thenable<void> { return this.secrets.store(key, value); }
  delete(key: string): Thenable<void> { return this.secrets.delete(key); }
}
```

- Secrets **only** in `SecretStorage` — never in `globalState`, `workspaceState`, settings, or a file.
- React to external changes via `context.secrets.onDidChange` if the UI must reflect them.

## Configuration wrapper — `models/configuration.ts`

```ts
import * as vscode from "vscode";
import { CONFIG } from "../constants";

export function getSetting<T>(key: keyof typeof CONFIG, fallback: T): T {
  return vscode.workspace.getConfiguration("myext").get<T>(CONFIG[key], fallback);
}
export function onConfigChange(cb: () => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("myext")) cb();
  });
}
```

- Every setting read here is declared in `contributes.configuration` (`@rules/manifest.md`) with `myext.*` keys.
- Register the change listener's disposable into `context.subscriptions`.

## Anti-patterns — what NOT to do

- **Do not** read/write a Memento, secret, or setting with a raw string key outside the wrappers / `constants.ts`.
- **Do not** store a secret anywhere but `SecretStorage`.
- **Do not** put a large dataset in a Memento — use `globalStorageUri` + `workspace.fs` for structured files.
- **Do not** introduce a database (SQLite, etc.) — out of v1 scope; the native stores cover the need.
- **Do not** read a setting by a key not declared in `contributes.configuration`.

## Integrity verification

Detailed in `@rules/verification.md`. Key points: all state keys in `constants.ts`; access only via `storage.ts`/`secrets.ts`/`configuration.ts`; secrets never in Memento/settings; every declared setting read through the wrapper; config-change and secret-change listeners disposed via `context.subscriptions`.
