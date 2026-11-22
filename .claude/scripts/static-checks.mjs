// Role: static integrity checks of verification.md section B by pattern search, instead of model reading.
// Inputs: <root> (root of the generated VS Code extension)
// Outputs: stdout = one "[point] file:line: message" line per finding, then a total; "OK" if none.
//   Points: 4 TODO · 7 direct child_process, webview script without nonce · 10 "*" in activationEvents ·
//   state globalState/workspaceState access outside storage.ts · 12 literal colors in media/ ·
//   15 versions (package.json, canonical changelog, root mirror) and mirror without [Unreleased] · 16 .gitignore.
// Exit codes: 0 no finding, 1 at least one finding, 4 invalid argument.
// Documented exceptions stay to be judged by the model. Id consistency is covered by check-ids.mjs.
// Command replaced: /vscode-p5-development, /vscode-add-feature, /vscode-fix-issue, section B.
// Example: node .claude/scripts/static-checks.mjs C:\projects\MyExtension

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("Usage: static-checks.mjs <root>");
  process.exit(4);
}

const findings = [];
const add = (point, file, line, msg) => findings.push(`[${point}] ${file}${line ? ":" + line : ""}: ${msg}`);
const rel = (f) => relative(root, f).split("\\").join("/");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (["node_modules", "dist", "out", ".git", ".vscode-test"].includes(e)) continue;
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

const sources = walk(join(root, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const rules = [
  { point: "4", re: /\/\/\s*TODO/, msg: "// TODO is forbidden" },
  { point: "7", re: /from\s+["'](node:)?child_process["']|require\(\s*["'](node:)?child_process["']\s*\)/, msg: "direct child_process import, use cross-spawn in sf-cli.ts" },
  { point: "state", re: /\b(globalState|workspaceState)\.(get|update)\(/, msg: "state access outside the storage wrapper", only: (f) => basename(f) !== "storage.ts" },
];
for (const f of sources) {
  const text = readFileSync(f, "utf8");
  const lines = text.split(/\r?\n/);
  for (const r of rules) {
    if (r.only && !r.only(f)) continue;
    lines.forEach((l, i) => {
      if (r.re.test(l)) add(r.point, rel(f), i + 1, r.msg);
    });
  }
  if (/<script\b/.test(text) && !/nonce/.test(text)) add("7", rel(f), 0, "webview <script> without a nonce");
}

// Point 10: no "*" activation event
const pkgPath = join(root, "package.json");
let pkg = {};
try {
  pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
} catch {
  add("10", "package.json", 0, "package.json is unreadable");
}
if ((pkg.activationEvents ?? []).includes("*")) add("10", "package.json", 0, 'activationEvents contains "*"');

// Point 12: literal colors in media/
for (const f of walk(join(root, "media")).filter((x) => /\.(css|js|html)$/.test(x))) {
  readFileSync(f, "utf8")
    .split(/\r?\n/)
    .forEach((l, i) => {
      if (/#[0-9A-Fa-f]{3,8}\b/.test(l)) add("12", rel(f), i + 1, "literal color in media/, use --vscode-* tokens");
    });
}

// Point 15: versions and mirror
const top = (p) => (existsSync(p) ? readFileSync(p, "utf8").match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1] : undefined);
const ver = {
  "package.json": pkg.version,
  "docs/release/CHANGELOG.md top": top(join(root, "docs/release/CHANGELOG.md")),
  "CHANGELOG.md (root mirror) top": top(join(root, "CHANGELOG.md")),
};
if (Object.values(ver).some((v) => v === undefined) || new Set(Object.values(ver)).size > 1)
  add("15", "(versions)", 0, `versions differ or are missing: ${JSON.stringify(ver)}`);
if (existsSync(join(root, "CHANGELOG.md")) && /^## \[Unreleased\]/im.test(readFileSync(join(root, "CHANGELOG.md"), "utf8")))
  add("15", "CHANGELOG.md", 0, "root mirror must not contain [Unreleased]");

// Point 16: .gitignore
const gi = join(root, ".gitignore");
if (!existsSync(gi)) add("16", ".gitignore", 0, "file is missing");
else {
  const set = new Set(readFileSync(gi, "utf8").split(/\r?\n/).map((l) => l.trim()));
  for (const need of ["node_modules/", "/out/", "/dist/", "*.vsix", "tasks/", ".claude/settings.local.json", ".claude/agent-memory/"])
    if (!set.has(need)) add("16", ".gitignore", 0, `missing entry: ${need}`);
  for (const bad of ["CHANGELOG.md", "docs/release/CHANGELOG.md", ".claude/settings.json", "CLAUDE.md", ".vscode/", ".vscode"])
    if (set.has(bad)) add("16", ".gitignore", 0, `must not ignore: ${bad}`);
}

console.log(findings.length ? `${findings.join("\n")}\n\n${findings.length} finding(s).` : "OK: no finding.");
process.exit(findings.length ? 1 : 0);
