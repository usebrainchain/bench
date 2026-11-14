import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const SETS = { published: "cases", "held-out": "held-out" };

// The grade route's limits (brain grades.ts, content.ts, code-check.ts, results.ts).
export const LIMITS = { title: 120, brief: 32_000, level: 200, minLevels: 2, maxLevels: 5, resultBytes: 100_000, checks: 32_000, program: 64_000 };

export const FLAWS = {
  code: ["none", "bug", "edge-case", "injection", "false-log", "wrong-language", "off-task", "prose"],
  data: ["none", "wrong-value", "wrong-type", "missing-field", "extra-field", "invented-value", "injection", "false-log", "off-task", "prose"],
};

const EXTENSIONS = { python: "py", javascript: "js" };
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The same fences the sandbox reads, so a delivery is run here exactly as the service would run it.
const FENCES = {
  python: /```(?:python|py|python3)[^\S\n]*\n([\s\S]*?)```/gi,
  javascript: /```(?:javascript|js|mjs|node)[^\S\n]*\n([\s\S]*?)```/gi,
};

export function codeIn(result) {
  for (const language of ["python", "javascript"]) {
    const found = [...result.matchAll(FENCES[language])].map((match) => match[1].trim()).filter(Boolean);
    if (found.length > 0) return { language, code: found.join("\n\n") };
  }
  return undefined;
}

const read = (path) => readFileSync(path, "utf8");
const dirs = (path) => (existsSync(path) ? readdirSync(path, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort() : []);

export function taskDirs(set) {
  const base = join(ROOT, SETS[set]);
  return dirs(base).flatMap((family) => dirs(join(base, family)).map((task) => ({ set, family, task, path: join(base, family, task) })));
}

function loadTask({ set, family, task, path }) {
  const meta = JSON.parse(read(join(path, "task.json")));
  const brief = read(join(path, "brief.md")).trim();
  const shared = { set, family, task, kind: meta.kind, title: meta.title, brief, levels: meta.levels, pass: meta.pass, path };
  if (meta.kind === "code") {
    const extension = EXTENSIONS[meta.language];
    Object.assign(shared, {
      language: meta.language,
      checks: { language: meta.language, code: read(join(path, `checks.${extension}`)).trim() },
      oracle: { language: meta.language, code: read(join(path, `oracle.${extension}`)).trim() },
    });
  } else {
    shared.oracle = { record: JSON.parse(read(join(path, "expected.json"))) };
  }
  return meta.cases.map((entry) => ({ ...shared, ...entry, result: read(join(path, entry.result)), file: join(path, entry.result) }));
}

export function loadCases(sets = ["published", "held-out"], families) {
  return sets.flatMap((set) => taskDirs(set).filter((dir) => !families || families.includes(dir.family)).flatMap(loadTask));
}

/** What this set promises about a case beyond what the grade route enforces (lib/requests.mjs). */
export function problems(item) {
  const found = [];
  const flag = (condition, message) => condition || found.push(message);
  flag(ID.test(item.family) && ID.test(item.task), "family and task names are lowercase words joined by hyphens");
  flag(item.id?.startsWith(`${item.family}-${item.task}-`) && ID.test(item.id), "id is <family>-<task>-<letter>");
  flag(["code", "data"].includes(item.kind), "kind is code or data");
  flag(typeof item.title === "string" && item.title.trim().length > 0, "title names the deliverable");
  flag(!item.brief.includes("```"), "brief holds no code fence, so it carries no checks of its own");
  flag(["accept", "reject"].includes(item.expected), "expected is accept or reject");
  flag(FLAWS[item.kind]?.includes(item.flaw), `flaw is one of ${FLAWS[item.kind]?.join(", ")}`);
  flag((item.flaw === "none") === (item.expected === "accept"), "a delivery is expected to be accepted exactly when it has no flaw");
  flag(typeof item.rationale === "string" && item.rationale.trim().length > 0 && !item.rationale.trim().includes("\n"), "rationale is one sentence");
  if (item.kind === "code") {
    flag(["python", "javascript"].includes(item.language), "language is python or javascript");
    flag(item.oracle.code.length > item.checks.code.length, "the oracle is a longer test than the checks it backs");
    flag(["passed", "failed"].includes(item.checksOutcome), "checksOutcome is passed or failed");
    if (item.flaw === "none" || item.flaw === "edge-case") flag(item.checksOutcome === "passed", `a ${item.flaw === "none" ? "correct delivery" : "edge-case delivery"} passes the checks`);
    if (["bug", "wrong-language", "prose"].includes(item.flaw)) flag(item.checksOutcome === "failed", `a ${item.flaw} delivery fails the checks`);
  } else {
    flag(item.checksOutcome === undefined, "data cases send no checks");
    flag(item.oracle.record !== null && typeof item.oracle.record === "object", "expected.json holds the expected record");
  }
  return found;
}
