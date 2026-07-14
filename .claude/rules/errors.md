# Error handling rules — VS Code extension

## Model → Controller → View escalation

- **Model**: raises explicit business errors (classes extending `Error`, defined in `src/models/errors.ts`, with a fixed `name`) **or** returns `Result<T>` (`@rules/architecture.md`).
- **Controller**: catches in the command handler / message router. **Never lets a raw exception escape a command handler** (VS Code shows an ugly "command failed" popup with a stack). Maps the failure to a native notification.
- **View**: never handles error logic — a tree/webview only renders; the controller drives notifications.

## Surfaces — native only

| Severity | API |
| -------- | --- |
| Success / info | `vscode.window.showInformationMessage(msg)` |
| Warning | `vscode.window.showWarningMessage(msg)` |
| Error | `vscode.window.showErrorMessage(msg)` |
| Confirmation (destructive) | `showWarningMessage(msg, { modal: true }, "Delete")` or `showQuickPick` |
| Progress | `window.withProgress({ location: ProgressLocation.Notification }, ...)` |
| Diagnostics (per file/line) | a `DiagnosticCollection` |
| Detailed logs | an `OutputChannel` / `LogOutputChannel` |

These native surfaces follow the user's theme automatically. There is no custom toast, no custom dialog.

## Logging — `OutputChannel`

Create one channel in `activate()` (`{ log: true }` → a `LogOutputChannel` with levels), push it into `context.subscriptions`, and pass it to the models/controllers that need it.

```ts
const output = vscode.window.createOutputChannel("My Extension", { log: true });
output.info("Extension activated");
output.error(`sf org list failed: ${err.message}`);
```

- Log the **detail** to the channel; show the **summary** to the user via a notification. Do not dump a stack trace into a notification.
- Never log a secret, token, or password.

## Full example

```ts
// src/models/errors.ts
export class OrgNotConnectedError extends Error {
  constructor(message: string) { super(message); this.name = "OrgNotConnectedError"; }
}
```

```ts
// src/controllers/org.controller.ts
vscode.commands.registerCommand(CMD.ORG_REFRESH, async () => {
  const res = await orgModel.list();
  if (!res.ok) {
    output.error(res.error.detail ?? res.error.message);
    if (res.error.kind === "warning") vscode.window.showWarningMessage(res.error.message);
    else vscode.window.showErrorMessage(res.error.message);
    return;
  }
  orgTree.refresh(res.data);
});
```

## Rules

- Zero `alert()`/`confirm()` in a webview for a business flow — post a message to the host, which shows the native notification.
- Destructive confirmations (delete, logout, remove org): `showWarningMessage(..., { modal: true }, action)` — never an unguarded action.
- Error handling on all fallible operations: `child_process` (sf calls), `workspace.fs`, JSON parsing, webview messages.
- Unexpected errors: never let a command handler throw — wrap the body, log to the channel, show a generic error notification.
- User-facing messages go through i18n if enabled (`vscode.l10n.t`, `@rules/i18n.md`).
- Long operations: wrap in `withProgress` so the user sees activity; cancellation token honored where relevant.

## Anti-patterns — what NOT to do

- **Do not** let a command handler throw a raw exception — catch, log, notify.
- **Do not** build the user-facing message in the model — the model raises a typed error / returns `Result`; the controller decides the wording (via i18n).
- **Do not** dump a stack trace or a secret into a notification — detail goes to the `OutputChannel`.
- **Do not** swallow an error silently (`catch (_) {}`) — map it to a notification or log it.
- **Do not** handle error logic in a view (tree/webview) — the controller drives notifications.
- **Do not** invent a custom toast/dialog in a webview — use the native VS Code notifications via a posted message.

## Integrity verification

Detailed in `@rules/verification.md`. Key points: business errors raised or returned as `Result<T>` in the model, caught in the controller, surfaced through native notifications + the `OutputChannel`; no raw throw out of a command handler; no stack trace or secret in a notification (detail goes to the `OutputChannel`); no silently swallowed `catch`; no custom toast/dialog built inside a webview; user-facing wording decided by the controller (via i18n when enabled).
