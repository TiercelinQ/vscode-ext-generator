# Salesforce CLI integration rules — VS Code extension

> Conditional — only when Phase 1 "Salesforce CLI" = `Yes`. When enabled, the default scaffold is **runner + typed helpers + a starter Org Manager** (`@rules/architecture.md`). Targets the **`sf` v2 CLI** only. The extension never handles OAuth tokens — `sf` owns the auth flow and the OS keychain.

## Command catalog (source of truth for sf commands/flags)

This rule is the **hub** that routes every sf-aware skill to the command catalog under `.claude/sf-cli-reference/`. Whenever you write or modify an `sf` invocation (a helper's `argv`, a new subcommand, a flag):

1. **Never invent** an `sf` command, subcommand, or flag from memory — verify it against the catalog.
2. Read `sf-cli-reference/INDEX.md` first (small: convention + capability → file map), then **open only the section file** matching the capability you need (`auth-orgs.md`, `metadata-deploy.md`, `apex.md`, `data.md`, `packaging.md`, `users-schema.md`, `platform-api.md`, `advanced.md`). **Never read the whole catalog** — it is large; section-scoped reads keep the context lean.
3. Each catalog entry states the exact flags and whether `--json` / `--api-version` / `-o, --target-org` apply. The typed helpers below source their `argv` from there.
4. The catalog reflects `sf` v2 at a given release; field names/flags drift across versions. For anything uncertain or recent (`advanced.md` plugins), confirm against the installed CLI with `sf <command> --help`.

## Principle

The extension shells out to the user's `sf` binary with `--json` and parses the envelope. Everything the integration needs (orgs, auth, SOQL, Tooling API, metadata, Apex) is an `sf` subcommand — no `jsforce`/`@salesforce/core` dependency.

- `sf` is a **runtime prerequisite**; if absent → a clear notification. **Not** an `extensionDependencies` on the official pack — the extension is standalone. The official Salesforce Extension Pack is a documented optional recommendation in the README only.
- **Resolve `sf` cross-OS via a `sfPath` setting (no platform branch).** Contribute a `<ext>.sfPath` setting (`@rules/manifest.md` / `@rules/state.md`): empty → the bare command `sf` is resolved from PATH (cross-spawn); set → the configured absolute path is used. A `getSfBin()` reader in `models/configuration.ts` returns the path (or `"sf"`), injected into `SfCli` (`new SfCli(getSfBin)`). This covers non-standard installs (the standalone installer's bundled binary, custom paths) on every OS without an `if (win32)`.
- **Install (cross-OS, documented in the README, not imposed)**: the official `sf` installer for the user's OS (Windows / macOS / Linux) bundles its own Node and avoids coupling to the system Node version; `npm install -g @salesforce/cli` also works but runs on the system Node. Either way the extension only needs `sf` reachable (PATH or `sfPath`).
- **Use `cross-spawn`, not `node:child_process`.** On Windows the `sf` binary is a `sf.cmd` shim; a bare `child_process.spawn("sf", …, { shell:false })` fails with `ENOENT` (and Node's security fix blocks running a `.cmd` without a shell). `cross-spawn` resolves the shim and **escapes arguments correctly** — it keeps the "argument array, no injectable shell" guarantee on every OS. Add `cross-spawn` (dependency) + `@types/cross-spawn` (dev) and `esModuleInterop: true` in `tsconfig.json` (see `@rules/config.md`). `cross-spawn` is bundled by esbuild into `dist/extension.js` — so `.vscodeignore` must exclude `node_modules/**`.

## Runner — `src/models/sf-cli.ts`

```ts
import spawn from "cross-spawn";          // resolves the Windows sf.cmd shim, escapes args — no injectable shell
import type { Result } from "../types";

export interface SfEnvelope<T> { status: number; result: T; warnings?: string[]; message?: string; name?: string; }

export class SfCli {
  /** `resolveBin` returns the sf command/path to run (PATH or the `sfPath` setting). Cross-OS, no platform branch. */
  constructor(private readonly resolveBin: () => string = () => "sf") {}

  /** Run `sf <args> --json`. args is an ARRAY — never a concatenated shell string (security). */
  async run<T>(args: string[]): Promise<Result<T>> {
    return new Promise((resolve) => {
      const child = spawn(this.resolveBin(), [...args, "--json"]);   // cross-spawn — args array, no injectable shell
      let out = "", err = "";
      child.stdout?.on("data", (d) => (out += d));       // cross-spawn types streams as nullable
      child.stderr?.on("data", (d) => (err += d));
      child.on("error", (e) =>
        resolve(this.fail("error", e.message.includes("ENOENT")
          ? "Salesforce CLI (sf) introuvable. Install the CLI or set the `<ext>.sfPath` setting."
          : e.message)));
      child.on("close", () => {
        let parsed: SfEnvelope<T> | undefined;
        try { parsed = JSON.parse(out || err); } catch { /* non-JSON output */ }
        if (!parsed) return resolve(this.fail("error", "Réponse sf illisible.", err || out));
        if (parsed.status !== 0) return resolve(this.fail("error", parsed.message ?? "Commande sf en échec.", parsed.name));
        resolve({ ok: true, data: parsed.result });
      });
    });
  }
  private fail(kind: "warning" | "error", message: string, detail?: string): Result<never> {
    return { ok: false, error: { kind, message, detail } };
  }
}
```

- `spawn(bin, [...args, "--json"])` via **`cross-spawn`** — argument array, no shell (cross-spawn never spawns through a shell, so there is no injectable command line). User values (alias, SOQL) are **separate array elements**, never spliced into a string. This is the command-injection guard (`@rules/security.md`).
- Parse **defensively**: `sf` field names vary across CLI versions. Read the `status`/`result` envelope, guard missing fields, and verify the actual shape at generation time against the installed `sf`.
- Map a non-zero `status` / `ENOENT` / unparseable output to a `Result` error — the controller decides the notification.

## Typed helpers (on top of the runner)

```ts
listOrgs(): Promise<Result<OrgInfo[]>>            // sf org list           → result.nonScratchOrgs / scratchOrgs (defensive)
getDefaultOrg(): Promise<Result<string | undefined>>  // sf config get target-org
setDefaultOrg(alias: string): Promise<Result<void>>   // sf config set target-org=<alias>
loginWeb(alias: string): Promise<Result<void>>    // sf org login web --alias <alias>   (sf opens the browser)
logout(alias: string): Promise<Result<void>>      // sf org logout --target-org <alias> --no-prompt
reconnect(alias: string): Promise<Result<void>>   // re-run login web for an expired token
query(soql: string, org?: string): Promise<Result<QueryResult>>          // sf data query --query <soql>
queryTooling(soql: string, org?: string): Promise<Result<QueryResult>>   // sf data query --use-tooling-api --query <soql>
retrieve(args): Promise<Result<...>>              // sf project retrieve start
deploy(args): Promise<Result<...>>                // sf project deploy start
runApex(file: string, org?: string): Promise<Result<...>>                // sf apex run --file <file>
```

- Each helper builds the args array and delegates to `run<T>()`. Model the return types defensively (only the fields the UI uses).
- **Every helper's command and flags are verified against the catalog** (the comment after each helper points at its capability): orgs/auth/config → `sf-cli-reference/auth-orgs.md`, `query`/`queryTooling` → `data.md`, `runApex` → `apex.md`, `retrieve`/`deploy` → `metadata-deploy.md`. Do not guess a flag — look it up in the matching section file.
- `OrgInfo`: read `alias`, `username`, `connectedStatus` (e.g. `Connected`, `RefreshTokenAuthError`), `isDefaultUsername`, `instanceUrl` when present.

## Auth orchestration

- The extension **drives** `sf org login/logout` and `sf config set target-org`; it never reads, writes, or stores a token. `sf` performs the OAuth web flow and stores tokens in its own keychain.
- "Reconnect on expired token" = re-run `sf org login web` for that alias (`connectedStatus === "RefreshTokenAuthError"`).
- The extension may store a **non-secret** alias in Memento; never a token (`@rules/state.md` / `@rules/security.md`).

## Starter Org Manager (default scaffold)

- **View** (`src/views/orgs-tree.ts`): a `TreeDataProvider` listing orgs from `listOrgs()`. Each item:
  - icon via `ThemeIcon` — connected (`$(pass-filled)`) vs disconnected (`$(error)`), default org marked (`$(star-full)` or a description suffix).
  - `contextValue` (`CTX.ORG`) driving `view/item/context` commands.
- **Container + view** contributed in `package.json` (`viewsContainers.activitybar` + `views`), ids in `constants.ts` (`@rules/manifest.md`).
- **Commands** (`src/controllers/org.controller.ts`), wired to the helpers, each with input validation and an error notification on failure:
  - `org.add` → `loginWeb` (ask alias as free-form input).
  - `org.remove` → `logout` (modal confirmation).
  - `org.reconnect` → `reconnect`.
  - `org.setDefault` → `setDefaultOrg`.
  - `org.refresh` → re-`listOrgs` + `tree.refresh()`.
- After any mutating command, refresh the tree.

## Anti-patterns — what NOT to do

- **Do not** build the `sf` command as a concatenated string or use `shell: true` with interpolated input — pass an args array via `cross-spawn`.
- **Do not** call `node:child_process.spawn("sf", …)` directly — on Windows it fails to resolve the `sf.cmd` shim (`ENOENT`). Use `cross-spawn`.
- **Do not** read, store, or log an org token — `sf` owns tokens; the extension stores at most a non-secret alias.
- **Do not** add `jsforce`/`@salesforce/core` for the v1 use cases — the CLI covers them.
- **Do not** declare `extensionDependencies` on the official Salesforce pack — `sf` binary is the only requirement, detected at runtime.
- **Do not** assume exact `sf --json` field names — parse defensively and verify against the installed CLI.
- **Do not** target `sfdx` (legacy) — `sf` v2 only.

## Integrity verification

Detailed in `@rules/verification.md`. Key points (if sf enabled): all `sf` calls go through `sf-cli.ts` via **`cross-spawn`** with an args array (no `node:child_process` direct, no shell); `sf` resolved from PATH or the `<ext>.sfPath` setting (cross-OS, no platform branch); ENOENT → clear error pointing to install / `sfPath`; no token stored/logged; Org Manager commands validate input and refresh the tree; `node_modules/**` excluded from the `.vsix` (cross-spawn bundled); README documents the cross-OS `sf` prerequisite + `sfPath` + optional pack recommendation.
