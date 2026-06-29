# Security rules — VS Code extension — NON-NEGOTIABLE

Applied to 100% of generated extensions. Any deviation requires the contract declaration protocol (stop → declare → validate).

## 1. Webview isolation (if webview enabled)

- `enableScripts: true` only when needed; `localResourceRoots` limited to `dist`/`media`.
- **Strict CSP with a per-load nonce** in the webview HTML: `default-src 'none'`; `script-src 'nonce-...'`; `style-src ${webview.cspSource} 'unsafe-inline'`; `img-src ${webview.cspSource} data:`; `font-src ${webview.cspSource}`. No `'unsafe-eval'`, no remote origin. See `webview-ui.md` / `@rules/webview.md`.
- Every local resource via `webview.asWebviewUri(...)`. No CDN, no remote font/script/style.
- No inline event handler (`onclick=`) — scripts run only with the nonce.

## 2. Untrusted input validation

- **Webview → host messages** (`onDidReceiveMessage`): treat as untrusted. Validate `type` and every field (presence, type, bounds) before acting.
- **Command arguments** (commands can be invoked by other extensions / keybindings / URIs): validate args; never assume a tree item shape.
- **`Uri` handlers** (`window.registerUriHandler`): validate the authority/path/query before acting.
- Validation by dedicated TS type guards — a schema library only if validated in Phase 1.

## 3. Process execution (if Salesforce CLI or any CLI)

- Spawn with an **argument array**, never `exec` with a concatenated string, never `shell: true` with interpolated user input. This is the command-injection guard. On Windows, prefer **`cross-spawn`** over `node:child_process` for npm-installed CLIs (`sf`): it resolves the `.cmd` shim and escapes arguments while keeping the no-injectable-shell guarantee. See `@rules/sf-cli.md`.
- User-provided values (org alias, SOQL, paths) go in as **separate array elements**, never spliced into a command string.
- Validate/whitelist any value used as a subcommand or flag.

## 4. Secrets

- Tokens, passwords, API keys: **`SecretStorage` only** (`models/secrets.ts`) — OS keychain, encrypted. Never in `globalState`/`workspaceState`/settings/a file/the code.
- For the Salesforce integration: the extension never stores org tokens — `sf` owns them in its own keychain (`@rules/sf-cli.md`). The extension stores at most a non-secret alias.
- Never log a secret to the `OutputChannel` or a notification.

## 5. Workspace & filesystem

- File access through `vscode.workspace.fs` (respects the virtual FS and remote). Resolve and check any path built from input — stay within the workspace / extension storage; no traversal.
- Honor **Workspace Trust** when the feature runs workspace code or external tools: gate such features behind `vscode.workspace.isTrusted` and declare `capabilities.untrustedWorkspaces` in the manifest when relevant.
- No file written outside `context.globalStorageUri` / `context.storageUri` / the workspace (with consent).

## 6. Network & supply chain

- No remote resource loaded into a webview (everything bundled / via `asWebviewUri`).
- Outbound network only for a feature validated in Phase 1; never silently.
- `npm audit` mentioned in the last-batch instructions; dependencies pinned (`@rules/config.md`).

## 7. Misc

- No `eval`, no `new Function`, no dynamic `require` of untrusted paths.
- Telemetry: none by default. If added, gate it behind `vscode.env.isTelemetryEnabled` + the `telemetry` setting.
- Keep `@types/vscode` and the engine floor aligned (`@rules/manifest.md`) — do not call an API the floor lacks.

## Anti-patterns — what NOT to do

- **Do not** enable scripts in a webview without a strict CSP + nonce, or load a remote script/font/style.
- **Do not** trust a webview message, command arg, or URI without validating it.
- **Do not** build a shell command by string concatenation, or use `shell: true` with interpolated input — `spawn` with an args array.
- **Do not** store a secret outside `SecretStorage`, or log it.
- **Do not** write outside the allowed storage/workspace, or ignore Workspace Trust for code-executing features.
- **Do not** use `eval` / `new Function` / dynamic `require` of untrusted input.
