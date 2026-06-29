---
name: vscode-show-contract
description: Show the complete validated architectural contract (Phase 4) — tree with the role of each file and the contribution points. Reads docs/specs/04-architect.md.
model: haiku
---

# /vscode-show-contract — Validated architectural contract

## Role

Contract reporter.

## Goal

Display the locked contract from the source of truth.

## Deliverable

The contract on screen (in the user's language).

---

Read `docs/specs/04-architect.md` (the locked source of truth) and display the complete validated tree with the role of each file, followed by the contribution points table (commands / views / settings / keybindings) and the state map.

If `docs/specs/04-architect.md` does not exist and no contract has been validated in session yet: `No validated contract — Phase 4 not reached.`

Do not append the `/vscode-save-session` · `/vscode-show-state` · `/vscode-show-contract` reminder after this reply.
