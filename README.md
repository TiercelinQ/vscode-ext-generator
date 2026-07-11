# VS Code Extension Generator - Unified

> Claude Code generator for **VS Code extensions** - TypeScript · esbuild · native VS Code theming.

Part of a family of Claude Code generators. See also [electron-app-generator](https://github.com/TiercelinQ/electron-app-generator), [flutter-app-generator](https://github.com/TiercelinQ/flutter-app-generator), [python-app-generator](https://github.com/TiercelinQ/python-app-generator), and [sf-node-generator](https://github.com/TiercelinQ/sf-node-generator).

Unified edition: the full generation pipeline **plus** post-delivery maintenance skills, an explicit role per skill, persisted specs, centralized executable verification, and native memory.

---

## What it does

A structured prompt system that generates complete, marketplace-ready VS Code extensions through a 5-phase cycle, then maintains them:

1. **Scoping** - parameters (i18n, tests, webview, Salesforce CLI, icon) + conservative `engines.vscode` floor. No palette: VS Code themes every native surface automatically.
2. **Featuring** - structured feature sheet, explicit out-of-scope, locked sizing
3. **Surfaces** - map features onto contribution points (commands, tree views, status bar, menus, optional webview); for ≥2 webview features, a hosting model (single hub vs one tab per feature); per webview, its type and layout skeleton (semantic regions, still native)
4. **Architect** - full file tree, contribution-points table, manifest map, state map - locked before any code is written
5. **Development** - auto-chained batch delivery, `.vsix` packaging

Each phase writes a spec in the user's language to `docs/specs/` (`01-scoping` … `04-architect`); the contract is the source of truth.

**Maintenance commands**: `/vscode-add-feature` (add a feature, contract-compliant — explicit contract-diff validation before writing), `/vscode-trace-feature` (trace behavior), `/vscode-fix-issue` (root-cause debugging with a decision tree), `/vscode-refactor-code` (validated, behavior-preserving), `/vscode-run-tests` (executable verification). Plus `/vscode-load-project` (unified take-over confirmation) and `/vscode-generate-readme` to load/document existing extensions. Session resume is handled by `/vscode-app` (option 2 or a pasted SESSION block).

Every generated extension follows the same MVC architecture, native VS Code theming, and security rules (webview CSP + nonce, validated input, secrets in `SecretStorage`).

---

## Native theming, not a design system

VS Code themes every native surface (commands, tree views, status bar, quick picks, menus) automatically — so this generator has **no** design-system or layout file and **no** palette to choose. The only styled surface is an optional webview, and even then the UI uses the `--vscode-*` CSS variables and the `body.vscode-dark/light/high-contrast` classes: it follows the user's active theme with zero extra code. A webview can still have structure (header, aside, footer) via a bounded set of semantic layout skeletons — structure only, styling stays token-driven and flat, so the result still looks native. The single visual reference is `.claude/webview-ui.md`, loaded only when a webview is in scope.

---

## Generated extension stack

| Element        | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Target         | VS Code extension (desktop)                                 |
| Language       | TypeScript strict                                          |
| Build          | esbuild (`dist/extension.js`)                              |
| Architecture   | MVC - `src/models/` · `src/controllers/` · `src/views/` · `src/extension.ts` |
| UI             | Native surfaces (auto-themed) + optional webview (`--vscode-*` tokens) |
| State          | globalState / workspaceState · SecretStorage · configuration |
| i18n           | package.nls.json + vscode.l10n FR/EN (opt-in)              |
| Salesforce CLI | `sf` v2 wrapper + helpers + starter Org Manager (opt-in)   |
| Tests          | @vscode/test-cli + Mocha (opt-in)                          |
| Packaging      | @vscode/vsce (`vsce package` → `.vsix`)                    |
| Security       | webview CSP + nonce · validated input · secrets in SecretStorage · `spawn` args array |
| Quality        | ESLint + Prettier · TSDoc · `Result<T>` error contract     |

---

## Requirements

```bash
claude --version    # Claude Code CLI - installed and authenticated
node --version      # Node.js (to build the generated extensions)
code --version      # VS Code (to run / debug the extension)
```

The Salesforce integration (opt-in) additionally needs the `sf` CLI v2 on the PATH for the generated extension to run.

---

## Getting started

```bash
git clone https://github.com/TiercelinQ/vscode-ext-generator.git
cd vscode-ext-generator
claude
```

Then in Claude Code:

```
/vscode-app
```

---

## Commands

| Command                 | Action                                             |
| ----------------------- | -------------------------------------------------- |
| `/vscode-app`           | Start menu (4 entry points incl. maintenance)      |
| `/vscode-p1-scoping`    | Scoping - parameters + engine floor                |
| `/vscode-p2-featuring`  | Featuring - requirements sheet + locked sizing     |
| `/vscode-p3-surfaces`  | Surfaces - contribution points + UX                |
| `/vscode-p4-architect`  | Architect - locked architecture contract           |
| `/vscode-p5-development`| Auto-chained batch delivery + `.vsix`              |
| `/vscode-add-feature`   | Add a feature to a shipped extension               |
| `/vscode-trace-feature` | Trace a feature across the layers                  |
| `/vscode-fix-issue`     | Fix a bug - decision tree, root cause              |
| `/vscode-refactor-code` | Refactor under explicit validation only            |
| `/vscode-run-tests`     | Executable verification (typecheck, lint, build, package) |
| `/vscode-load-project`  | Load an existing project from its specs/README     |
| `/vscode-generate-readme`| Generate README.md for an existing project        |
| `/vscode-save-session`  | Save current session state                         |
| `/vscode-show-state`    | Current project status                             |
| `/vscode-show-contract` | Display locked architecture contract               |
| `/vscode-save-memory`   | Persist a note in Claude Code native memory        |

---

## Generated extension structure

```
my-extension/
├── package.json                  # manifest: engines, contributes, activationEvents, scripts
├── esbuild.js · tsconfig.json · eslint.config.mjs · .prettierrc · .vscodeignore
├── .vscode/launch.json · tasks.json   # F5 debug
├── README.md
├── CLAUDE.md                      # Extension identity (origin, business context, deviations)
├── .claude/settings.json          # Guardrails + lint hook (self-enforced)
├── docs/specs/                    # Generation specs (user's language): 01-scoping … 04-architect
├── l10n/ · package.nls*.json      # i18n (if enabled)
├── media/                         # webview assets (if webview)
├── resources/                     # extension icon
└── src/
    ├── extension.ts              # activate()/deactivate() — composition root
    ├── constants.ts · types.ts   # command/view ids · Result<T>, DTOs, webview messages
    ├── models/                   # storage · secrets · configuration · errors · sf-cli (if sf) · entities
    ├── controllers/              # command handlers, event handlers, webview router
    └── views/                    # TreeDataProvider · status bar · webview provider
```

---

## Security

`.claude/rules/security.md` is non-negotiable, applied to 100% of generated extensions: webview isolation (strict CSP + nonce, `asWebviewUri`, minimal `localResourceRoots`), every untrusted input validated (webview messages, command args, URIs), secrets only in `SecretStorage`, and any CLI call (`sf`) through `cross-spawn` with an argument array (no shell injection). `/vscode-fix-issue` and `/vscode-add-feature` always route through it.

---

## Documentation

- [GUIDE.md](GUIDE.md) - full usage guide (FR)
- `.claude/webview-ui.md` - the only visual reference (webview `--vscode-*` tokens, CSP + nonce)
- `.claude/sf-cli-reference/` - `sf` v2 command/flag catalog (`INDEX.md` + 8 capability files), the source of truth for sf commands — consulted by section when the Salesforce integration is on
- `.claude/rules/` - domain rules:
  - `architecture.md` · `manifest.md` · `webview.md` · `state.md` · `errors.md` · `security.md` · `i18n.md` · `config.md` · `tests.md` · `sf-cli.md` · `verification.md` · `readme.md`
  - `verification.md` - single source of truth for executable + static checks

---

## Generator family

| Generator | Stack | Target |
| --------- | ----- | ------ |
| [python-app-generator](https://github.com/TiercelinQ/python-app-generator) | Python · PyQt6 · QSS | Windows desktop |
| [electron-app-generator](https://github.com/TiercelinQ/electron-app-generator) | Node.js · Electron · React · TS | Windows desktop |
| [flutter-app-generator](https://github.com/TiercelinQ/flutter-app-generator) | Flutter · Dart · Riverpod | Android |
| [sf-node-generator](https://github.com/TiercelinQ/sf-node-generator) | Node.js · TypeScript · Salesforce CLI | Headless CLI |
| [vscode-ext-generator](https://github.com/TiercelinQ/vscode-ext-generator) | TypeScript · esbuild · native theming | VS Code extension |

---

## License

MIT
