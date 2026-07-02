---
name: vscode-show-state
description: Show the current state of the generation project — phase, batch, next action, locked decisions, open points.
model: haiku
---

# /vscode-show-state — Current state

## Role

Status reporter.

## Goal

Give a one-glance state of the project.

## Deliverable

The status block (in the user's language).

---

Show only (in the user's language):

Phase: [name] | Batch: [X/total] | Next: [expected action]
Locked decisions: [list]
Open points: [list or "none"]

If no project is active: "No active project. Type /vscode-app to start."

Do not append the `/vscode-save-session` · `/vscode-show-state` · `/vscode-show-contract` reminder after this reply.
