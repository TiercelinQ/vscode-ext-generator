# Automated tests rules — VS Code extension

## Activation

Conditional — enabled if Phase 1 tests = `Yes`.

If enabled:
- Test setup mandatory in the architectural contract (Phase 4).
- Dedicated extra batch in Phase 5 (Small: 4 batches · Medium/Large: 5 batches).
- Dev dependencies added (`@vscode/test-cli`, `@vscode/test-electron`, `mocha`, `@types/mocha`).

If disabled:
- No test files, no extra batch. Batch count unchanged (Small: 3 · Medium/Large: 4).

---

## Non-negotiable stack

- `@vscode/test-cli` + `@vscode/test-electron` — runs the suite inside a real Extension Development Host (the only way to exercise the `vscode` API).
- `mocha` (the runner `@vscode/test-cli` drives), TDD/BDD `suite`/`test`.
- No other test framework.

`package.json` script: `"test": "vscode-test"`.
`.vscode-test.mjs` at the root configures the runner:

```js
import { defineConfig } from "@vscode/test-cli";
export default defineConfig({ files: "out/**/*.test.js" });
```

> Use the glob `out/**/*.test.js`, **not** `out/test/**`: when the tsconfig `include` spans more than one top folder (e.g. `src/` **and** `media/` for a webview script), `tsc`'s computed `rootDir` becomes the project root, so tests land in `out/src/test/…`, not `out/test/…`. The broader glob is layout-proof.
>
> The integration tests load the **real** extension through the host, so its `main` (`dist/extension.js`) must exist **and** the tests must be compiled to `out/`. Make `pretest` do both: `"pretest": "npm run build && tsc -p ./"` (esbuild produces `dist/`, `tsc` emits the `out/` test build). Omitting the build → the activation test fails with `Cannot find module dist/extension.js`.
>
> **Windows caveat**: `@vscode/test-electron` mishandles **spaces in the absolute project path** (it splits the dev path at the space → `Cannot find module 'd:\…'`). Run `npm test` from a path without spaces, or document it. A `Error mutex already exists` line when another VS Code instance of the same version is open is non-fatal noise.

> **Mocha globals under TypeScript 6** (mandatory): ship `src/test/global.d.ts` with a single line — `/// <reference types="mocha" />`. Since TypeScript 6, `tsc` no longer auto-includes `@types/mocha`'s global TDD declarations, so every test file fails typecheck with `TS2593 Cannot find name 'suite' / 'test'` without it. Keep the reference in this dedicated `.d.ts`; do **not** add `mocha` to a tsconfig `types` array — that would break a no-tests project (where `mocha` is not installed → `Cannot find type definition file for 'mocha'`). The `.d.ts` exists only in the tests batch. See `@rules/config.md` (test stack also requires **Node ≥ 22**).

---

## What to test, per layer

| Layer                 | Target              | What to test                                                        |
| --------------------- | ------------------- | ------------------------------------------------------------------- |
| `src/models/`         | Business logic      | public methods, named errors, `Result` shapes, edge cases (external calls mocked) |
| `src/controllers/`    | Wiring + validation | invalid input rejected; a command registers and dispatches; failure → notification path |
| `src/views/`          | Smoke               | a `TreeDataProvider` returns the expected children for a known model state |
| Activation            | Integration         | `extension.activate` runs; contributed commands are registered (`vscode.commands.getCommands`) |

---

## Conventions

- File naming: `src/test/[area].test.ts`, compiled to `out/test/`.
- Test names: explicit French behavior — always French, independent of the UI language — e.g. `rejette_un_message_webview_sans_type`.
- No `assert.ok(true)`, no empty test, no `it.skip` left behind.
- No real network, no real `sf` process — stub `child_process` / the `sf-cli` model. No real secret.
- Use Mocha's `suite`/`test` and Node's `assert`. Async via `async`/`await`, never arbitrary `setTimeout` waits.

---

## Activation test pattern (mandatory)

```ts
import * as assert from "assert";
import * as vscode from "vscode";
import { CMD } from "../constants";

suite("activation", () => {
  test("s'active et enregistre les commandes contribuées", async () => {
    const ext = vscode.extensions.getExtension("<publisher>.<name>");
    assert.ok(ext, "extension introuvable");
    await ext.activate();   // commands are registered in activate() — activate before asserting
    const all = await vscode.commands.getCommands(true);
    assert.ok(all.includes(CMD.ENTITY_REFRESH));
  });
});
```

> The extension id is `<publisher>.<name>` from `package.json`. Activating first is required: contributed commands are only *registered* once `activate()` runs.

## Model test pattern (mandatory)

```ts
import * as assert from "assert";
import { OrgModel } from "../models/org.model";

suite("org.model", () => {
  test("retourne une erreur quand sf est absent", async () => {
    const model = new OrgModel({ run: async () => ({ ok: false, error: { kind: "error", message: "sf introuvable" } }) } as any);
    const res = await model.list();
    assert.strictEqual(res.ok, false);
  });
});
```

---

## Anti-patterns — what NOT to do

- **Do not** write `assert.ok(true)`, an empty test, or a left-over `skip`.
- **Do not** spawn the real `sf` CLI or hit the network — stub the `sf-cli` model / `child_process`.
- **Do not** use arbitrary `setTimeout` waits — `await` the operation.
- **Do not** test through esbuild's `dist/` bundle — compile tests with `tsc` to `out/` (`pretest`).
- **Do not** create a test suite when Phase 1 tests = No (`/vscode-run-tests` never scaffolds one unasked).

## Integrity verification

Detailed in `@rules/verification.md`. Key points: if enabled, `.vscode-test.mjs` present, `pretest` compiles to `out/`, `npm test` exit 0, dev dependencies present, each major area has a matching test (Phase 4 mapping).
