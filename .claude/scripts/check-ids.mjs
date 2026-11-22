// Role: cross-check the ids of a VS Code extension: src/constants.ts, the package.json "contributes" block,
//   the registered handlers (registerCommand, registerTreeDataProvider, createTreeView,
//   registerWebviewViewProvider) and the "view ==" clauses of menus and keybindings.
// Inputs: <root> (root of the generated extension)
// Outputs: stdout = one line per problem, then a total; "OK" if the ids are consistent:
//   - command contributed in package.json without a registered handler
//   - command registered in code without a contribution
//   - menu or keybinding referencing an undeclared command
//   - "view ==" clause referencing an undeclared view
//   - id declared in constants.ts used by neither package.json nor the code
// Exit codes: 0 consistent, 1 at least one problem, 4 invalid argument.
// Mending the broken link stays with the model. Internal commands (not contributed) may be reported as
//   "registered without a contribution": judge them case by case.
// Command replaced: manual id cross-check in /vscode-add-feature, /vscode-fix-issue (section 4) and verification.md B9.
// Example: node .claude/scripts/check-ids.mjs C:\projects\MyExtension

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2];
if (!root || !existsSync(join(root, "package.json"))) {
  console.error("Usage: check-ids.mjs <root> (package.json required)");
  process.exit(4);
}

const rel = (f) => relative(root, f).split("\\").join("/");
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (["node_modules", "dist", "out", ".git"].includes(e)) continue;
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const contributes = pkg.contributes ?? {};

// 1. Symbols of constants.ts: NAME.KEY -> "value" and NAME -> "value"
const symbols = new Map();
const constFile = join(root, "src", "constants.ts");
if (existsSync(constFile)) {
  let object = null;
  for (const line of readFileSync(constFile, "utf8").split(/\r?\n/)) {
    const open = line.match(/export\s+const\s+(\w+)\s*(?::[^=]+)?=\s*\{/);
    const plain = line.match(/export\s+const\s+(\w+)\s*(?::[^=]+)?=\s*["'`]([^"'`]+)["'`]/);
    const entry = line.match(/^\s*(\w+)\s*:\s*["'`]([^"'`]+)["'`]/);
    if (open) {
      object = open[1];
      const rest = line.slice(line.indexOf("{") + 1);
      for (const m of rest.matchAll(/(\w+)\s*:\s*["'`]([^"'`]+)["'`]/g)) symbols.set(`${object}.${m[1]}`, m[2]);
      if (rest.includes("}")) object = null;
      continue;
    }
    if (plain) symbols.set(plain[1], plain[2]);
    else if (object && entry) symbols.set(`${object}.${entry[1]}`, entry[2]);
    if (object && /^\s*\}/.test(line)) object = null;
  }
}
const resolve = (arg) => (/^["'`]/.test(arg) ? arg.slice(1, -1) : (symbols.get(arg) ?? `?${arg}`));

// 2. Registrations in code
const code = walk(join(root, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const registered = { command: new Map(), view: new Map() };
const patterns = [
  { kind: "command", re: /registerCommand\(\s*([A-Za-z0-9_.]+|["'`][^"'`]+["'`])/g },
  { kind: "view", re: /(?:registerTreeDataProvider|createTreeView|registerWebviewViewProvider)\(\s*([A-Za-z0-9_.]+|["'`][^"'`]+["'`])/g },
];
for (const f of code) {
  const text = readFileSync(f, "utf8");
  for (const { kind, re } of patterns)
    for (const m of text.matchAll(re)) {
      const id = resolve(m[1]);
      if (!registered[kind].has(id)) registered[kind].set(id, rel(f));
    }
}

// 3. Contributions
const commands = new Set((contributes.commands ?? []).map((c) => c.command));
const views = new Set(Object.values(contributes.views ?? {}).flat().map((v) => v.id));
const referenced = new Set();
for (const group of Object.values(contributes.menus ?? {})) for (const m of group) if (m.command) referenced.add(m.command);
for (const k of contributes.keybindings ?? []) if (k.command) referenced.add(k.command);
const whens = [
  ...Object.values(contributes.menus ?? {}).flat().map((m) => m.when),
  ...(contributes.keybindings ?? []).map((k) => k.when),
].filter(Boolean);

// 4. Compare
const problems = [];
for (const c of commands) if (!registered.command.has(c)) problems.push(`command "${c}" is contributed but has no registered handler`);
for (const [c, f] of registered.command) if (!commands.has(c)) problems.push(`command "${c}" is registered in ${f} but not contributed`);
for (const c of referenced) if (!commands.has(c)) problems.push(`menu or keybinding references undeclared command "${c}"`);
for (const w of whens)
  for (const m of w.matchAll(/\bview\s*==\s*([\w.-]+)/g)) if (!views.has(m[1])) problems.push(`"view == ${m[1]}" references an undeclared view`);
const used = new Set([...commands, ...views, ...registered.command.keys(), ...registered.view.keys()]);
const codeText = code.map((f) => readFileSync(f, "utf8")).join("\n");
for (const [symbol, value] of symbols) {
  const isId = commands.has(value) || views.has(value) || value.includes(".");
  const referencedInCode = new RegExp(`\\b${symbol.replace(".", "\\.")}\\b`).test(codeText.replace(/export\s+const[\s\S]*?as const;?/g, ""));
  if (isId && !used.has(value) && !referencedInCode) problems.push(`constants.ts "${symbol}" ("${value}") is used by neither package.json nor the code`);
}

console.log(problems.length ? `${problems.join("\n")}\n\n${problems.length} problem(s).` : "OK: ids are consistent.");
process.exit(problems.length ? 1 : 0);
