# Guide d'utilisation — VS Code Extension Generator (unifié)

> Générateur d'extensions VS Code : pipeline de génération + skills de maintenance, rôle explicite par skill, specs persistées, vérification exécutable, mémoire native. Thème VS Code natif (pas de design-system ni de palette).

---

## Structure du framework

```
vscode/
├── CLAUDE.md                 # Instructions core (EN) · persona · communication · index commandes · calibrage
├── GUIDE.md                  # Ce fichier
├── README.md                 # Présentation du repo (EN)
├── LICENSE.txt
└── .claude/
    ├── webview-ui.md         # UNIQUE référence visuelle (tokens --vscode-*, CSP+nonce, codicons, squelettes de layout/régions) — chargée à la demande si webview
    ├── sf-cli-reference/     # Catalogue commandes/flags sf v2 (INDEX.md + 8 fichiers par capacité) — chargé par section si intégration Salesforce
    ├── rules/
    │   ├── architecture.md  # Couches models/controllers/views, arbre, composition root, lots
    │   ├── manifest.md      # package.json contributes, activationEvents (auto), engines
    │   ├── webview.md       # Création webview, lifecycle, message passing typé (côté extension host)
    │   ├── state.md         # globalState/workspaceState, SecretStorage, configuration
    │   ├── errors.md        # Notifications natives + OutputChannel, zéro throw nu
    │   ├── security.md      # CSP+nonce webview, validation des entrées, secrets, spawn args array
    │   ├── i18n.md          # package.nls.json (manifeste) + vscode.l10n (runtime)
    │   ├── config.md        # constants.ts, versions épinglées, esbuild.js, scripts
    │   ├── tests.md         # @vscode/test-cli + Mocha
    │   ├── sf-cli.md        # (opt-in) Runner sf --json, helpers typés, Org Manager, auth orchestrée
    │   ├── verification.md  # Vérification EXÉCUTABLE centralisée + intégrité statique
    │   └── readme.md        # Synchro README post-livraison (régénération auto)
    ├── skills/
    │   ├── vscode-app/            # Menu démarrage / reprise / maintenance (4 options)
    │   ├── vscode-p1-scoping/     # Scoping — paramètres + engine floor → docs/specs/01-scoping.md
    │   ├── vscode-p2-featuring/   # Fiche besoins → docs/specs/02-featuring.md
    │   ├── vscode-p3-designing/   # Surfaces & UX (contribution points) → docs/specs/03-designing.md
    │   ├── vscode-p4-architect/   # Contrat architectural verrouillé → docs/specs/04-architect.md
    │   ├── vscode-p5-development/ # Livraison par lots + packaging .vsix (enchaînement auto)
    │   ├── vscode-add-feature/    # Ajouter une feature à un projet livré (respect contrat + sécurité)
    │   ├── vscode-trace-feature/  # Tracer une fonctionnalité à travers les couches
    │   ├── vscode-fix-issue/      # Corriger un bug — arbre de décision, cause racine
    │   ├── vscode-refactor-code/  # Restructurer sous validation explicite uniquement
    │   ├── vscode-run-tests/      # Vérification exécutable (typecheck, lint, build, package)
    │   ├── vscode-load-project/   # Chargement d'un projet existant
    │   ├── vscode-generate-readme/ # Génération README.md projet existant
    │   ├── vscode-save-session/   # Sauvegarde de session
    │   ├── vscode-show-state/     # État courant du projet
    │   ├── vscode-show-contract/  # Arborescence du contrat validé
    │   └── vscode-save-memory/    # Persiste dans la mémoire native Claude Code
    ├── settings.json         # Permissions d'exécution (npm, npx, node) + garde-fous deny (.env, secrets, artefacts, .vsix)
    └── settings.local.json   # Overrides locaux (non versionné)
```

> Pas de `design-system.md` ni de `layout.md` : VS Code thème nativement toutes les surfaces non-webview. La seule référence visuelle est `webview-ui.md`, utile uniquement si l'extension embarque une webview.

---

## Spécificités vs les autres générateurs

| Apport                        | Détail                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **Thème natif**               | Aucune palette, aucun design-system. Les surfaces VS Code suivent le thème utilisateur automatiquement. |
| **Surfaces (Phase 3)**        | La phase « design » devient « surfaces & UX » : choix des contribution points (commandes, vues arbre, status bar, menus, webview). |
| **Rôle par skill**            | Chaque skill ouvre sur un persona ciblé (Role / Goal / Deliverable).            |
| **Specs persistées**          | Phases 1→4 écrivent `docs/specs/01-scoping.md` … `04-architect.md`.             |
| **Contrat = source de vérité**| `docs/specs/04-architect.md` relu par load-project, show-contract, add-feature, refactor-code. |
| **Intégration Salesforce CLI**| Option opt-in : runner `sf --json` + helpers typés + Org Manager (tree view), auth orchestrée via `sf`. |
| **Vérification exécutable**   | `rules/verification.md` : typecheck, lint, build esbuild, package vsce — échec bloquant. |
| **Mémoire native**            | `/vscode-save-memory` écrit dans la mémoire native Claude Code + `MEMORY.md`.   |

---

## Installation

```bash
# Démarrer Claude Code depuis le dossier du framework (ou copier dans le projet cible).
claude
```

### Prérequis

```bash
claude --version      # Claude Code CLI installé et connecté
node --version        # Node.js (pour construire les extensions générées)
code --version        # VS Code (pour lancer / déboguer l'extension : F5)
```

L'intégration Salesforce (opt-in) requiert en plus le CLI `sf` v2 dans le PATH pour exécuter l'extension générée.

### Activer la mémoire (une seule fois, par machine)

```
/config → Memory → Enable auto memory → On
```

---

## Démarrer une nouvelle extension

```
/vscode-app → 1
```

### Phase 1 — Scoping

Objectif + racine du projet + questions groupées : i18n FR/EN · tests (`@vscode/test-cli` + Mocha) · **webview** (oui/non) · **intégration Salesforce CLI** (oui/non) · icône. Pas de palette. Le plancher `engines.vscode` (conservateur) est annoncé et vérifié contre la version courante de VS Code. Calibrage annoncé.

| Taille        | Lots (sans tests) | Lots (avec tests) |
| ------------- | ----------------- | ----------------- |
| Petit         | 3                 | 4                 |
| Moyen / Grand | 4                 | 5                 |

Écrit `docs/specs/01-scoping.md`.

### Phase 2 — Featuring

Nom de l'extension + élicitation des features + MoSCoW + périmètre v1.0 + calibrage figé. Validation bloquante avant Phase 3. Écrit `docs/specs/02-featuring.md`.

### Phase 3 — Surfaces

Mapping des features sur les contribution points VS Code : commandes (Command Palette), vues arbre, conteneur de vues (activity bar), status bar, menus contextuels, keybindings, webview (si activée). Si ≥ 2 features passent par un webview, choix du **modèle d'hébergement** : un webview **hub** (navigation interne via `<nav>`) ou un **onglet dédié par feature** (recommandation contextuelle). Pour chaque webview : type (onglet `WebviewPanel` recommandé / vue dockée) + **structure de layout** (squelette de régions sémantiques `header/nav/main/aside/footer`, voir `webview-ui.md`). Validation bloquante. Écrit `docs/specs/03-designing.md`.

### Phase 4 — Architect

Arborescence + rôle de chaque fichier + **tableau des contribution points** (id → kind → handler/provider → model → surface) + **carte du manifeste** (`contributes`, `activationEvents`) + **carte d'état** (globalState/secrets/configuration) + par webview (si webview) : **modèle d'hébergement** (hub / onglet par feature), id `viewType`, type, squelette/régions et contrat de messages + surface sf-cli (si sf). **Verrouillé après validation.** Écrit `docs/specs/04-architect.md` (source de vérité).

### Phase 5 — Development

Fichiers écrits directement sur le disque. Annonce `Lot N/[total] — [contenu]`. `extension.ts` en dernier. Dernier lot : `package.json` finalisé, `esbuild.js`, `.vscode/launch.json` (F5), README, `CLAUDE.md`, `.claude/settings.json` (hook Stop → `npm run lint`), puis `vsce package` → `.vsix`. Commandes de publication documentées (`vsce publish` / `ovsx publish`), aucune cible imposée. Vérification exécutable appliquée.

---

## Reprendre une session

```
/vscode-save-session             # sauvegarder en fin de session (docs/sessions/)
/vscode-app → 2    # reprendre : fournir le chemin du fichier SESSION
```

---

## Travailler sur un projet livré

```
/vscode-app → 3     # ou directement /vscode-load-project depuis la racine du projet
```

Claude lit `docs/specs/04-architect.md` (priorité), sinon le README, sinon le code, puis applique toutes les règles. Projet sans README : `/vscode-generate-readme`.

### Maintenance (`/vscode-app → 4`)

| Besoin                          | Commande      |
| ------------------------------- | ------------- |
| Ajouter une fonctionnalité      | `/vscode-add-feature`   |
| Comprendre / tracer le code     | `/vscode-trace-feature`     |
| Corriger un bug                 | `/vscode-fix-issue`         |
| Restructurer (sous validation)  | `/vscode-refactor-code`    |
| Vérifier le build / lancer les checks | `/vscode-run-tests`  |

---

## Vérification exécutable

`rules/verification.md` est la source unique. Commandes (échec bloquant quand l'environnement le permet) :

```bash
npm install
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint
npm run build                # esbuild → dist/extension.js
npm test                     # vscode-test (si tests activés)
npm run package              # vsce package → .vsix
```

> Smoke fonctionnel : `F5` lance l'Extension Development Host (activation, commandes, vues).

`/vscode-run-tests` exécute cette échelle ; `/vscode-fix-issue` y renvoie pour confirmer une correction.

---

## Sécurité

`rules/security.md` est non négociable et appliqué à 100% : isolation webview (CSP stricte + nonce, `asWebviewUri`, `localResourceRoots` minimal), validation de toute entrée non fiable (messages webview, arguments de commande, URIs), secrets uniquement dans `SecretStorage`, et tout appel CLI (`sf`) via `cross-spawn` avec un tableau d'arguments (zéro injection shell). `/vscode-fix-issue` et `/vscode-add-feature` y renvoient systématiquement.

---

## Intégration Salesforce CLI (option)

Activée en Phase 1 (recommandée automatiquement si l'objectif mentionne Salesforce, Apex, org, SOQL, etc.). Le scaffold par défaut fournit :
- `src/models/sf-cli.ts` : runner `sf … --json` (`spawn` args array, parse défensif de l'enveloppe) + helpers typés (`listOrgs`, `setDefaultOrg`, `loginWeb`, `logout`, `reconnect`, `query`, `queryTooling`, `deploy`, `retrieve`, `runApex`).
- Un **Org Manager** : vue arbre listant les orgs (statut connecté/déconnecté, org par défaut) avec commandes add / remove / reconnect / set-default / refresh.
- Auth orchestrée : l'extension pilote `sf org login/logout`, `sf` possède le flow OAuth et les tokens (keychain). L'extension ne manipule jamais de token.

`sf` v2 est requis au runtime (détecté, message clair si absent). Le pack officiel Salesforce reste une recommandation documentée, pas une dépendance dure.

Les commandes et flags `sf` ne sont jamais inventés : le générateur s'appuie sur le catalogue `.claude/sf-cli-reference/` (INDEX + 8 fichiers par capacité), consulté par section selon le besoin (orgs/auth → `auth-orgs.md`, requêtes → `data.md`, Apex → `apex.md`, etc.). Il sert de source de vérité en génération comme en maintenance (add-feature, fix-issue, refactor, trace).

---

## Gestion des anomalies et mémoire

Après correction (`/vscode-fix-issue` ou Phase 5), Claude produit un bilan de nettoyage puis propose `Veux-tu mémoriser ce point ? /vscode-save-memory`. `/vscode-save-memory` catégorise et écrit dans la **mémoire native Claude Code** (+ `MEMORY.md`).

---

## Commandes de référence

| Commande                | Modèle | Action                                               |
| ----------------------- | ------ | ---------------------------------------------------- |
| `/vscode-app`           | Haiku  | Menu démarrage / reprise / maintenance               |
| `/vscode-p1-scoping`    | Sonnet | Scoping — paramètres + engine floor                  |
| `/vscode-p2-featuring`  | Sonnet | Fiche besoins                                        |
| `/vscode-p3-designing`  | Sonnet | Surfaces & UX (contribution points)                  |
| `/vscode-p4-architect`  | Sonnet | Contrat architectural verrouillé                     |
| `/vscode-p5-development`| Sonnet | Livraison par lots + packaging .vsix                 |
| `/vscode-add-feature`   | Sonnet | Ajouter une feature à un projet livré                |
| `/vscode-trace-feature` | Sonnet | Tracer une fonctionnalité à travers les couches      |
| `/vscode-fix-issue`     | Sonnet | Corriger un bug — cause racine                       |
| `/vscode-refactor-code` | Sonnet | Restructurer sous validation                         |
| `/vscode-run-tests`     | Sonnet | Vérification exécutable                               |
| `/vscode-load-project`  | Sonnet | Charger un projet existant                           |
| `/vscode-generate-readme`| Sonnet | Générer README.md d'un projet existant              |
| `/vscode-save-session`  | Haiku  | Sauvegarder la session                               |
| `/vscode-show-state`    | Haiku  | État courant                                         |
| `/vscode-show-contract` | Haiku  | Contrat architectural validé                         |
| `/vscode-save-memory`   | Haiku  | Persister dans la mémoire native                     |

---

## Points de vigilance

- `.claude/webview-ui.md` est la **seule** référence visuelle, et uniquement pour les webviews — ne pas chercher de palette ni de design-system.
- Sécurité (`.claude/rules/security.md`) non négociable — CSP+nonce webview, validation des entrées, secrets en `SecretStorage`, `spawn` args array.
- Les ids de commandes/vues/settings sont centralisés dans `src/constants.ts` — zéro id en dur ailleurs.
- Le contrat (`docs/specs/04-architect.md`) est verrouillé. Tout changement structurel passe par `/vscode-add-feature` ou le protocole de déclaration d'écart.
- `engines.vscode` et `@types/vscode` épinglés au même plancher conservateur — vérifier la version courante à la génération.
- Aucune ressource distante (CDN) dans une webview — tout est embarqué via `asWebviewUri`.
