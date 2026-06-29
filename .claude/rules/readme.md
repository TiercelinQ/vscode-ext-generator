# README synchronization rule

> The generated extension's `README.md` is a **derived** document — its source of truth is the code plus `docs/specs/04-architect.md`. After any post-delivery change, the README must keep reflecting what shipped. This is the single, shared definition of when and how to refresh it. Referenced by `/vscode-add-feature`, `/vscode-fix-issue`, `/vscode-refactor-code`.

## What the README documents

objective · features · stack & dependencies · file tree · contribution points (commands, views, settings, keybindings) · activation · state/storage · prerequisites (incl. the `sf` CLI if the Salesforce integration is on) · installation & run (F5, build, `vsce package`).

The marketplace also renders this README on the extension page, so keep it accurate and user-facing. Exact sections: `/vscode-generate-readme`.

## When to refresh (trigger)

Regenerate the README **iff** the change touched a documented aspect above:
- a dependency added/removed, or a stack change,
- the file tree changed (a file/model/controller/view added, renamed, moved, or deleted),
- a contribution point changed (command, view, view container, menu, setting, keybinding added or renamed),
- an activation event changed,
- a prerequisite changed (e.g. the `sf` integration toggled, the engine floor bumped),
- build, packaging, or install steps changed.

A purely internal change (a private method, the body of an existing controller, a bug fix with no structural impact) does **not** trigger a refresh.

## How to refresh

Regenerate the README via the logic of `/vscode-generate-readme` (reads specs + code), in the same delivery, without asking. Full regeneration — the README is derived, so hand edits are not preserved. No manual "offer" step.

## Read-only skills

Verification/analysis skills (`/vscode-run-tests`, `/vscode-trace-feature`) never rewrite the README. At most they flag it as stale; refreshing is done by the write skills above.
