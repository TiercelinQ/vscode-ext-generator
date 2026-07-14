# Config, build, dependencies rules — VS Code extension

## `src/constants.ts` structure

The single home for every contributed id and config key (the VS Code analogue of `ipc-channels.ts`). Referenced by the manifest, controllers, and views.

```ts
// Commands — value = the id in contributes.commands
export const CMD = {
  ENTITY_REFRESH: "myext.entity.refresh",
  ENTITY_DELETE: "myext.entity.delete",
} as const;

// Views / view containers
export const VIEW = { ENTITY: "myext.entityView", CONTAINER: "myext-container" } as const;

// Tree item contextValues (drive view/item/context when-clauses)
export const CTX = { ENTITY: "entity" } as const;

// Settings keys (declared in contributes.configuration as myext.<key>)
export const CONFIG = { SOME_SETTING: "someSetting" } as const;

// State keys (Memento)
export const STATE_KEYS = { LAST_SELECTION: "myext.lastSelection" } as const;
```

- Any id reused across the manifest and the code lives here. **Zero hardcoded id string** elsewhere.
- No color, no visual value anywhere in TS — webview styling lives in CSS via `--vscode-*` (`webview-ui.md`).

## `package.json` — mandatory scripts

```json
{
  "scripts": {
    "vscode:prepublish": "npm run build",
    "build": "node esbuild.js --production",
    "watch": "node esbuild.js --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vscode-test",
    "package": "vsce package"
  }
}
```

- `vscode:prepublish` runs before `vsce package`/`publish` — must produce `dist/extension.js`.
- `"test"` and `vscode-test` only if tests enabled (`@rules/tests.md`).

## esbuild — `esbuild.js`

Bundle the extension host code to a single CommonJS file, `vscode` external (provided by the runtime).

```js
const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node18",
    outfile: "dist/extension.js",
    external: ["vscode"],          // provided by the VS Code runtime — never bundle it
    sourcemap: !production,
    minify: production,
    logLevel: "info",
  });
  if (watch) { await ctx.watch(); }
  else { await ctx.rebuild(); await ctx.dispose(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- If a webview has its own script (`media/main.ts`): add a **second** esbuild entry (`entryPoints: ["media/main.ts"]`, `platform: "browser"`, `format: "iife"`, `outfile: "media/main.js"`) — never bundle the webview script into the extension bundle (different platform/context). The webview script needs the **DOM** lib: add `"DOM"` to `compilerOptions.lib` and `media/**/*.ts` to the tsconfig `include`. Declare `acquireVsCodeApi` (`declare function acquireVsCodeApi(): { postMessage(m: unknown): void; getState(): unknown; setState(s: unknown): void };`). Use `ReturnType<typeof setTimeout>` for timer ids (DOM + node libs both present). Ship `media/main.js` + the CSS in the `.vsix`; exclude `media/**/*.ts`.
- `vscode` is always `external`. `target: node18` matches the Electron/Node baseline of recent VS Code; align with the engine floor.

## TypeScript

- `strict: true`. `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "module": "Node16", "target": "ES2022", "lib": ["ES2022"],
    "moduleResolution": "Node16", "esModuleInterop": true, "strict": true,
    "noUnusedLocals": true, "noUnusedParameters": true,
    "sourceMap": true, "outDir": "out", "rootDir": "src",
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "dist", "out", ".vscode-test"]
}
```

- `tsc` is used for **typecheck only** (`--noEmit`); esbuild produces the shipped bundle.
- `any` forbidden unless justified with a comment. Webview messages / command args are `unknown` then validated.
- TSDoc on exported classes and public methods.

## Dependency versioning

`package.json`: caret versions (`^`), pinned to the minor validated in Phase 1. `package-lock.json` committed.

```jsonc
"devDependencies": {
  "@types/vscode": "1.96.0",            // EXACT, == engines.vscode floor (no caret)
  "@types/node": "^20.0.0",             // matches the floor's Node runtime (VS Code 1.96 → Node 20), NOT the dev machine
  "typescript": "^6.0.0",
  "esbuild": "^0.28.0",
  "eslint": "^10.0.0",
  "typescript-eslint": "^8.0.0",
  "prettier": "^3.9.0",
  "@vscode/vsce": "^3.0.0"
  // if sf:     "@types/cross-spawn": "^6.0.6"   (runtime dep "cross-spawn": "^7.0.6" — @rules/sf-cli.md)
  // if webview: "@vscode/codicons": "^0.0.36"   (not re-validated 2026-06-27 — no bench exercises it; re-confirm on a webview+codicons project)
  // if tests:  "@vscode/test-cli": "^0.0.15", "@vscode/test-electron": "^3.0.0", "mocha": "^11.0.0", "@types/mocha": "^10.0.0"
},
"engines": { "vscode": "^1.96.0" }
```

Versioning notes:
- **`@types/vscode` is pinned EXACT** (no caret) to the `engines.vscode` floor — they must agree, otherwise the types expose APIs the floor lacks (`@rules/manifest.md`).
- `engines.vscode`: conservative floor (~6-12 months back). **Verify the current VS Code version at generation** (`npm view @types/vscode versions`, VS Code release notes) and set both the engine and `@types/vscode` accordingly.
- `eslint ^10`: flat config (`eslint.config.mjs` — already the format). Requires **Node ≥ 20.19**. `typescript-eslint ^8` (latest 8.62) stays the major: its peer range already covers `eslint ^10` **and** `typescript` (`>=4.8.4 <6.1.0`) — there is no v9, no major bump needed.
- `typescript ^6`: **6.0.x shipped stable and is peer-compatible with `typescript-eslint 8.62`** (peer `<6.1.0`); the registry `latest` is now **7.x**, which typescript-eslint 8 does **not** support, so `^6` (→ 6.0.x) is deliberate — not `latest` / `^7`, until a typescript-eslint major widens the range. Breaking notes that do **not** affect the template: `moduleResolution: classic` removed (the tsconfig uses `Node16` ✓), `esModuleInterop: false` forbidden (the tsconfig sets it `true` ✓, also required by `cross-spawn`).
- `esbuild ^0.28`: `context()` API unchanged from 0.24 — no `esbuild.js` change.
- `@vscode/vsce`: packaging/publishing CLI (`vsce package` → `.vsix`).
- `@vscode/codicons`: only if a webview uses codicon glyphs (its CSS is loaded via `asWebviewUri`).
- **Tests** (if enabled): `@vscode/test-cli ^0.0.15` + `@vscode/test-electron ^3.0.0` + `mocha ^11` + `@types/mocha ^10` (`@rules/tests.md`). **This stack requires Node ≥ 22** (dev/test only — it does **not** move `engines.vscode`, the extension-host runtime). Two consequences:
  - **TS 6 drops `@types/mocha` auto-inclusion**: under TS 6 `tsc` no longer auto-includes `@types/mocha`'s global TDD declarations (`suite`/`test`, verified with `tsc --listFiles`) → the test typecheck fails with `TS2593 Cannot find name 'suite'`. Fix: ship `src/test/global.d.ts` with `/// <reference types="mocha" />` (`@rules/tests.md`). Do **not** add `mocha` to a tsconfig `types` array — it breaks no-tests projects (mocha absent).
  - **`npm audit`**: the current test stack carries 4 dev-only advisories via mocha's transitive `diff` / `serialize-javascript` (unpatched at mocha's latest, **not** in the shipped bundle — esbuild bundles only runtime deps into `dist/`). `npm audit fix --force` would *downgrade* `@vscode/test-cli` to `0.0.11` — do not run it.

> **Version maintenance** (validated 2026-06-27, unified edition): numbers re-confirmed green on two benches — `sf-org-manager` (native + tree + `sf`/cross-spawn, no tests) and `salesforce-monitor` (webview + tests + i18n) — running `npm install` · `tsc --noEmit` · `eslint .` · esbuild `--production` · `npm test` (7 passing) · `vsce package`. They age: before pinning a new project, re-confirm the current minors (`npm outdated`, release notes) and the breaking notes above. The caret rule and the exact-`@types/vscode` rule stay; the numbers are refreshed per project in Phase 1.

## ESLint — `eslint.config.mjs` (flat)

```js
import tseslint from "typescript-eslint";

export default tseslint.config(
  // MUST ignore build output, deps, and the downloaded test runtime — else `eslint .`
  // tries to lint the hundreds of MB of JS under .vscode-test/ and runs out of memory.
  { ignores: ["dist/**", "out/**", "node_modules/**", ".vscode-test/**", "esbuild.js", "media/*.js", "*.vsix"] },
  { files: ["src/**/*.ts", "media/**/*.ts"], extends: [...tseslint.configs.recommended] },
);
```

> `.vscode-test/**` is the single most important ignore once tests are enabled: it holds the full VS Code build downloaded by `@vscode/test-cli`. Omitting it makes `npm run lint` OOM.

## `.vscode/` — debug

```jsonc
// .vscode/launch.json
{ "version": "0.2.0", "configurations": [
  { "name": "Run Extension", "type": "extensionHost", "request": "launch",
    "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
    "outFiles": ["${workspaceFolder}/dist/**/*.js"], "preLaunchTask": "${defaultBuildTask}" } ] }
```

```jsonc
// .vscode/tasks.json — one-shot build as the default build task (F5 preLaunch)
{ "version": "2.0.0", "tasks": [
  { "label": "build", "type": "npm", "script": "build",
    "problemMatcher": [], "group": { "kind": "build", "isDefault": true } } ] }
```

> Use a **one-shot** `build` task with `"problemMatcher": []` as the default build task, so F5 builds `dist/` then launches with no external dependency. A `watch` task with `"$esbuild-watch"` gives a faster inner loop but that matcher comes from a third-party extension (`connor4312.esbuild-problem-matchers`); without it the background task never signals completion and F5 hangs. Only use the watch variant if that extension is a documented prerequisite.

## Extension icon

- File: `resources/icon.png`, 128×128 min. Referenced by `package.json` `"icon"`.
- If the user provides no icon in Phase 1: omit `"icon"` (VS Code shows a default), noted in the generated README.

## Anti-patterns — what NOT to do

- **Do not** bundle `vscode` (always `external`), or bundle the webview script into the extension bundle.
- **Do not** caret `@types/vscode` or let it diverge from `engines.vscode`.
- **Do not** emit JS with `tsc` for shipping — esbuild produces `dist/`; `tsc` is typecheck-only.
- **Do not** hardcode an id/key outside `src/constants.ts`.
- **Do not** ship `out/`, `src/`, or sourcemaps in the `.vsix` (`.vscodeignore`, `@rules/manifest.md`).

## Integrity verification

Detailed in `@rules/verification.md`. Key points: `vscode` kept external in the esbuild config and `main` pointing at `dist/extension.js` (the webview script bundled separately, `tsc` typecheck-only); `@types/vscode` pinned exact to the `engines.vscode` floor (never a caret); every id/key declared in `src/constants.ts` and nowhere else; dependency versions re-confirmed at generation; `.vscodeignore` excluding sources, tests, specs, and sourcemaps from the `.vsix`.
