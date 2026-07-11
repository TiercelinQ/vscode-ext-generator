# Webview UI reference — VS Code native theming

> Binding reference for **webview UI only** (Phase 1 webview = Yes). Loaded on demand by the UI skills, never auto-imported. Native surfaces (tree views, status bar, quick picks, menus) are themed by VS Code automatically and have **no** styling reference. There is no palette, no color choice, no light/dark derivation: the webview inherits the user's active theme through the `--vscode-*` CSS variables that VS Code injects into every webview document.

## Core principle

VS Code injects, into every webview, a set of CSS custom properties (`--vscode-*`) and a body class for the active theme kind (`vscode-light`, `vscode-dark`, `vscode-high-contrast`, `vscode-high-contrast-light`). Style **exclusively** against those. Never hardcode a color, never compute a dark variant: when the user switches theme, the webview follows with zero extra code.

```css
body {
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  font-weight: var(--vscode-font-weight);
}
```

## Token map — the `--vscode-*` variables to use

| Role | Variable |
| ---- | -------- |
| Default text | `--vscode-foreground` |
| Editor background (panel surface) | `--vscode-editor-background` |
| Side bar / view background | `--vscode-sideBar-background` |
| Muted / secondary text | `--vscode-descriptionForeground` |
| Error text | `--vscode-errorForeground` |
| Focus outline | `--vscode-focusBorder` |
| Panel / view border | `--vscode-panel-border`, `--vscode-widget-border` |
| Primary button bg / fg / hover | `--vscode-button-background` / `--vscode-button-foreground` / `--vscode-button-hoverBackground` |
| Secondary button | `--vscode-button-secondaryBackground` / `--vscode-button-secondaryForeground` |
| Input bg / fg / border / placeholder | `--vscode-input-background` / `--vscode-input-foreground` / `--vscode-input-border` / `--vscode-input-placeholderForeground` |
| Dropdown | `--vscode-dropdown-background` / `--vscode-dropdown-foreground` / `--vscode-dropdown-border` |
| List hover / active selection bg / fg | `--vscode-list-hoverBackground` / `--vscode-list-activeSelectionBackground` / `--vscode-list-activeSelectionForeground` |
| Link | `--vscode-textLink-foreground` / `--vscode-textLink-activeForeground` |
| Badge | `--vscode-badge-background` / `--vscode-badge-foreground` |
| Selection | `--vscode-editor-selectionBackground` |
| Warning / info | `--vscode-editorWarning-foreground` / `--vscode-editorInfo-foreground` |
| Scrollbar | `--vscode-scrollbarSlider-background` / `--vscode-scrollbarSlider-hoverBackground` / `--vscode-scrollbarSlider-activeBackground` |

Full catalog: the VS Code "Theme Color" reference. Pick the semantic variable that matches the role; do not approximate with a hardcoded color.

## Theme kind classes

VS Code sets one of these on `<body>`. Use them only when a variable does not already cover the difference (rare):

```css
body.vscode-high-contrast .card { border-width: 1px; }
```

Do **not** write `@media (prefers-color-scheme: ...)` — theming is driven by VS Code, not by the OS.

## Codicons (icons)

Use the built-in codicon font (no Font Awesome, no SVG asset for standard glyphs). In a webview, load the codicon CSS shipped with the `@vscode/codicons` dev dependency via `asWebviewUri`, then:

```html
<span class="codicon codicon-cloud"></span>
```

In native surfaces (tree items, status bar, quick pick), reference codicons by id: `new vscode.ThemeIcon("cloud")`, or `$(cloud)` inside a label string. Icon color follows the theme through `--vscode-icon-foreground` automatically.

## Content Security Policy + nonce (mandatory)

Every webview HTML document declares a strict CSP `<meta>` with a per-load nonce. Scripts run only with the matching nonce; no inline script without it, no remote resource.

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               style-src ${webview.cspSource} 'unsafe-inline';
               img-src ${webview.cspSource} data:;
               font-src ${webview.cspSource};
               script-src 'nonce-${nonce}';">
```

```ts
// generate a fresh nonce per render
function getNonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}
```

- All local resources (script, codicon CSS, images) are referenced through `webview.asWebviewUri(...)`; set `localResourceRoots` to the extension's `dist`/`media` folders only.
- `<script nonce="${nonce}" src="${scriptUri}">` — never an inline handler (`onclick=`), never a CDN.
- Detail and rationale: @rules/security.md / @rules/webview.md.

## Message passing (typed)

The webview and the extension host never share memory — they exchange **typed** messages. The full protocol (the `src/types.ts` message union, host-side routing + incoming-message validation, the `ready` handshake for the initial state, `setState`/`getState`) lives in **`@rules/webview.md` — "Typed message bridge"**, the single source. On the **webview (UI) side**, the script only renders host state and forwards user intents; it holds no business logic and no secret:

```ts
// webview script — render on a host message, forward intents (never business logic)
window.addEventListener("message", (e) => render(e.data));
button.addEventListener("click", () => vscode.postMessage({ type: "org:setDefault", username }));
```

## Retained layout primitives (no theme tokens needed)

VS Code does not expose these, so keep a small set of local CSS custom properties in the webview stylesheet (values are layout, not color — they do not break theming):

```css
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;  --space-6: 24px;
  --transition: 150ms ease;
  --z-content: 0; --z-sticky: 100; --z-overlay: 200; --z-toast: 300;
}
```

Flat by default: `border-radius: 0` (VS Code's own UI is flat), no box-shadow beyond what a variable provides, no gradient.

## Panel layout — regions & skeletons

Native look is about *style*, not *structure*: a webview may have a header, an aside, a footer — as long as every color/border/font comes from a `--vscode-*` token and the result stays flat. Two distinct levels — do not mix them.

### Level 1 — layout regions (HTML5 landmarks → grid cells)

A **closed vocabulary** of semantic landmarks. Each maps to one grid area; these are the **only** top-level cells:

| Region | Element | Role |
| ------ | ------- | ---- |
| Header | `<header>` | title / primary actions of the panel |
| Nav | `<nav>` | navigation block **internal** to the webview |
| Main | `<main>` | primary content — **exactly one** per document |
| Aside | `<aside>` | secondary content / sidebar |
| Footer | `<footer>` | status / footer actions |

### Level 2 — content structure inside a region

**Not** grid cells — they organize content *within* `<main>` (or another region):

- `<section>` — a titled, thematic group.
- `<article>` — a self-contained, **repeatable** unit (a card, a record). Typically what a message-driven list renders.

### Skeletons (pick one, or compose)

Arrange the Level-1 regions with CSS grid. Canonical skeletons:

| # | Regions | `grid-template-areas` |
| - | ------- | --------------------- |
| A | main | `"main"` |
| B | header + main | `"header" "main"` |
| C | header + main + footer | `"header" "main" "footer"` |
| D | aside + main | `"aside main"` |
| E | header + aside + main | `"header header" "aside main"` |
| F | header(toolbar) + nav/list + main | `"header header" "nav main"` |

```css
.layout {                          /* skeleton E */
  display: grid;
  grid-template-areas: "header header" "aside main";
  grid-template-columns: minmax(160px, 240px) 1fr;
  grid-template-rows: auto 1fr;
  gap: var(--space-3);
  height: 100vh;
}
header { grid-area: header; }
aside  { grid-area: aside; border-right: 1px solid var(--vscode-panel-border); overflow: auto; }
main   { grid-area: main; overflow: auto; }
```

- **Compose** beyond the table only from the same five landmarks (declare an explicit `grid-template-areas`). No other top-level region.
- Gaps/sizing via `--space-*`; separators via `--vscode-panel-border`; surfaces via `--vscode-editor-background` / `--vscode-sideBar-background`. Flat (`border-radius: 0`).
- Header/aside layouts breathe better in a **WebviewPanel** (editor tab) than in a narrow docked **WebviewView** — see `@rules/webview.md`.
- **Multiple webviews** (the *one-tab-per-feature* hosting model, `@rules/webview.md`): each gets its own region map + skeleton, locked per webview in the Phase 4 contract; file convention in `@rules/architecture.md`.
- **Hub** hosting model (one webview for several features): the `<nav>` region switches between feature views — each view is a `section`/`article` set inside `main`, the host posts the active view. A single region map + skeleton covers all the hub's views.

## Accessibility

- Respect `@media (prefers-reduced-motion: reduce)` — neutralize transitions/animations.
- Keep focus visible: rely on `outline: 1px solid var(--vscode-focusBorder)` for `:focus-visible`.
- VS Code guarantees theme contrast (including high-contrast themes) — do not override it with hardcoded colors.

## Anti-patterns — what NOT to do

- **Do not** hardcode a color, a hex, or a light/dark variant in a webview — use a `--vscode-*` variable.
- **Do not** add `@media (prefers-color-scheme)` — theming is VS Code's, via the body class + variables.
- **Do not** ship a webview without a strict CSP + nonce, or load a remote font/script/style (CDN).
- **Do not** reference a local resource by a raw path — use `webview.asWebviewUri`.
- **Do not** put business logic in the webview script — it renders and posts messages; logic lives in the extension host (controllers/models).
- **Do not** style native surfaces (tree views, status bar, quick picks) — they are themed by VS Code; there is nothing to style.
- **Do not** pull in Font Awesome or an icon SVG set for standard glyphs — use codicons.
- **Do not** add more than one `<main>`, or invent a top-level region outside the five landmarks (`header/nav/main/aside/footer`) — compose with `grid-template-areas`.
- **Do not** rebuild VS Code's own chrome (activity bar, tab bar, breadcrumbs) as a webview `<nav>` — prefer native surfaces for app-level navigation; `<nav>` is for navigation **inside** the panel only.
