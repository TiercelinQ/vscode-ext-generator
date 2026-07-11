# Webview rules — extension-host side

> Only when a webview is enabled (Phase 1 webview = Yes). Styling/theming of the webview document lives in `webview-ui.md` (the binding reference). This file covers the **extension-host** side: creating the webview, its lifecycle, security wiring, and the typed message bridge.

## When a webview, when a native surface

Prefer native surfaces. Use a webview only when the UI cannot be expressed as a tree view, status bar, quick pick, or settings:
- **WebviewPanel** (`window.createWebviewPanel`) — a full **editor tab**, opened on demand by a command. **Default choice**: it gets the whole editor area, opens/closes like a document, and needs **no** view container (just a `contributes.commands` entry — `@rules/manifest.md`).
- **WebviewView** (`registerWebviewViewProvider`) — docked in a sidebar/panel view container, like a tree view. Use it only when the UI must stay **persistently docked** next to the tree views; it costs an extra `viewsContainer` + `view` contribution and a registered provider.

A list/tree of items is a `TreeDataProvider`, not a webview. A confirmation is a `showQuickPick`/`showWarningMessage`, not a webview.

## Hosting model — one hub vs one tab per feature

When **two or more features** need webview UI, decide **once** how they are hosted (Phase 3 — `/vscode-p3-surfaces`, locked in the Phase 4 contract). This is **orthogonal** to single-instance, which always applies per webview (below):

- **Hub (single webview)** — one `viewType`, one open command, one panel. The features are views **inside** the same webview, switched by the internal `<nav>` landmark (`webview-ui.md` Panel layout). Lighter surface (one tab, one command); fits features that are views of the **same** dataset/workspace. The host posts the active view in the state; the webview renders the matching view (`section`/`article` set inside `main`).
- **One tab per feature** — one `viewType` + one open command + one panel **per** feature (the "Multiple webviews" convention below + the namespacing in `@rules/architecture.md`). Each feature opens in its **own** editor tab; fits **independent** features (each behaves like its own document).

- A **single** webview feature is trivially one webview — no decision.
- The Phase 4 contract records the model: the `viewType`(s), the open command(s), and — for a hub — the **feature → view map**. Both models keep **single-instance per webview** (track + `reveal()`, below).

## Creation — locked options

**Default — a `WebviewPanel` opened by a command (editor tab):**

```ts
// in the command handler — reveal the existing panel instead of opening a duplicate
if (currentPanel) { currentPanel.reveal(vscode.ViewColumn.Active); return; }
const panel = vscode.window.createWebviewPanel(
  VIEW.PANEL,                       // viewType — id in constants.ts
  title,                            // tab title (localizable via vscode.l10n.t)
  vscode.ViewColumn.Active,
  {
    enableScripts: true,            // only if the UI needs JS
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "dist"),
                         vscode.Uri.joinPath(context.extensionUri, "media")],
    retainContextWhenHidden: false, // true only if rebuilding state on reveal is expensive
  },
);
currentPanel = panel;
panel.webview.html = buildHtml(panel.webview, context.extensionUri);
panel.onDidDispose(() => { currentPanel = undefined; }, undefined, context.subscriptions);
```

**Alternative — a `WebviewView` docked in a view container** (only when it must stay persistently docked): register a `WebviewViewProvider`; inside `resolveWebviewView`, set the same `webview.options` and `webview.html = buildHtml(...)`.

- **HTML structure (regions/skeleton)** follows `webview-ui.md` (Panel layout): semantic landmarks `header/nav/main/aside/footer` arranged by a `grid-template-areas` skeleton, styled with `--vscode-*` tokens. The host builder only produces that markup; placement/style lives in `media/*.css`.
- **Multiple webviews**: one `viewType` id + provider/open-command each — this is the **one-tab-per-feature** hosting model (above). File convention in `@rules/architecture.md`.
- **Single-instance (per webview, both hosting models)**: a command opening a panel tracks its reference and `reveal()`s the existing one rather than spawning a duplicate of the **same** panel. With one tab per feature, track one reference **per** `viewType`.
- `enableScripts: true` only if the UI needs JS. Keep `localResourceRoots` minimal (`dist`, `media`).
- `retainContextWhenHidden: true` is costly (keeps the DOM alive) — use only when restoring state on reveal is genuinely expensive; otherwise re-render from a posted state.
- HTML is built by `src/views/webview/html.ts` with the CSP + nonce from `webview-ui.md`. Every local URI passes through `webview.asWebviewUri(...)`.

## Typed message bridge

The host and the webview never share memory. Define the message union once in `src/types.ts` and use it on both sides.

```ts
// src/types.ts
export type HostToWebview = { type: "state:set"; payload: EntityDto[] };
export type WebviewToHost = { type: "entity:action"; id: string };
```

```ts
// controller (host) — route incoming messages, never embed business logic in the view
panel.webview.onDidReceiveMessage(async (msg: WebviewToHost) => {
  switch (msg.type) {
    case "entity:action": {
      const res = await entityModel.act(msg.id);     // model owns the logic
      if (!res.ok) { vscode.window.showErrorMessage(res.error.message); return; }
      panel.webview.postMessage({ type: "state:set", payload: res.data });
      break;
    }
  }
}, undefined, context.subscriptions);
```

```js
// webview script (media/main.js) — render + forward intents only
const vscode = acquireVsCodeApi();
window.addEventListener("message", (e) => render(e.data));   // HostToWebview
button.addEventListener("click", () => vscode.postMessage({ type: "entity:action", id }));
```

- **Validate** every incoming `WebviewToHost` message in the controller (type + fields) before acting — see `@rules/security.md`. Treat it as untrusted input.
- The webview script **renders and posts intents**; it holds no business logic and no secret.
- Use `webview.postMessage` for host→webview; `acquireVsCodeApi().postMessage` for webview→host. Persist transient UI state with `vscode.setState`/`getState`, not in the host.
- **Initial state needs a `ready` handshake — never post it right after creating the webview.** VS Code does **not** buffer `postMessage`: a message sent before the webview script has registered its `message` listener is lost, so the view shows up empty even when state exists. The webview registers its listener, then posts `{ type: "ready" }`; the host replies with the initial state only on `ready`:

```js
// webview (media/main.ts) — register first, then announce readiness
window.addEventListener("message", (e) => render(e.data));
vscode.postMessage({ type: "ready" });
```
```ts
// host — send initial state on ready (right after createWebviewPanel; same inside resolveWebviewView for a WebviewView)
panel.webview.onDidReceiveMessage((msg: WebviewToHost) => {
  if (msg.type === "ready") panel.webview.postMessage({ type: "state:set", payload: model.get() });
});
```

## Lifecycle + disposal

- A `WebviewPanel` is disposed when the user closes the tab — handle `panel.onDidDispose` to clear the tracked reference (single-instance; the matching `viewType`'s reference under one tab per feature) and drop its listeners; push them into `context.subscriptions`.
- A `WebviewView`: register its `onDidReceiveMessage` listener and any timer into `context.subscriptions`, or dispose them in the provider.
- Refresh on relevant model changes by posting a new state, not by rebuilding the HTML each time (rebuild only on first load).

## Anti-patterns — what NOT to do

- **Do not** use a webview for what a tree view, quick pick, or settings page does natively.
- **Do not** set `enableScripts: true` without a strict CSP + nonce, or widen `localResourceRoots` beyond `dist`/`media`.
- **Do not** trust a `WebviewToHost` message — validate it in the controller.
- **Do not** put business logic, persistence, or a secret in the webview script.
- **Do not** reference a local resource by raw path — `webview.asWebviewUri` only.
- **Do not** leave `retainContextWhenHidden: true` on by default — it keeps the DOM alive for every hidden webview.
- **Do not** open a new `WebviewPanel` on each command invocation — track the reference (one per `viewType`) and `reveal()` the existing one (single-instance).
- **Do not** forget `onDidDispose` / `context.subscriptions` — webview listeners leak otherwise.
