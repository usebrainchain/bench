import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { availableParallelism, tmpdir } from "node:os";
import { relative } from "node:path";
import { parseArgs } from "node:util";

import { codeIn, loadCases, problems, ROOT, SETS } from "./lib/cases.mjs";
import { refusal, requestsFor } from "./lib/requests.mjs";

// Only repository-authored cases run here. This is not a sandbox for submitted work.
const TIMEOUT_MS = 10_000;
const OUTPUT_LIMIT = 4_000;
const PROFILE = '(version 1)(allow default)(deny network*)(deny file-write*)(allow file-write-data (literal "/dev/null"))';

const { values: args } = parseArgs({ options: { set: { type: "string", multiple: true }, family: { type: "string", multiple: true }, verbose: { type: "boolean", short: "v" } } });

// /usr/bin/python3 on macOS is a shim that writes a cache file; the sandbox would refuse it, so run the interpreter it points to.
function python() {
  const found = spawnSync("python3", ["-I", "-c", "import sys; print(sys.executable)"], { encoding: "utf8" });
  if (found.status !== 0) throw new Error("python3 is not on PATH");
  return found.stdout.trim();
}

function isolate(argv) {
  if (process.platform === "darwin") return ["sandbox-exec", "-p", PROFILE, ...argv];
  if (process.platform === "linux") return ["unshare", "--user", "--map-root-user", "--net", ...argv];
  throw new Error(`no network isolation for ${process.platform}; run on macOS or Linux`);
}

const interpreters = { python: isolate([python(), "-I", "-"]), javascript: isolate([process.execPath, "--input-type=module", "-"]) };

// A run passes only when the program reaches its last line, so an early exit in the delivered code cannot pass for it.
function run(language, program) {
  const done = `bench-done-${randomBytes(8).toString("hex")}`;
  const source = `${program}\n\n${language === "python" ? `print(${JSON.stringify(done)})` : `console.log(${JSON.stringify(done)});`}\n`;
  const [command, ...argv] = interpreters[language];
  return new Promise((resolve) => {
    const child = spawn(command, argv, { cwd: tmpdir(), env: { PATH: process.env.PATH, LANG: "en_US.UTF-8", PYTHONHASHSEED: "0" }, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    const collect = (chunk) => {
      output = (output + chunk).slice(-OUTPUT_LIMIT * 2);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    const timer = setTimeout(() => child.kill("SIGKILL"), TIMEOUT_MS);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const passed = code === 0 && output.includes(done);
      const outcome = signal === "SIGKILL" ? "timed out" : passed ? "passed" : "failed";
      resolve({ outcome, output: output.replaceAll(done, "").trim().slice(-OUTPUT_LIMIT) });
    });
    child.stdin.end(source);
  });
}

// The service's order of events: delivered code in the brief's language, then the tests appended to it.
async function codeRun(item, tests) {
  const delivered = codeIn(item.result);
  if (delivered?.language !== tests.language) return { outcome: "failed", output: `no ${tests.language} code in the result` };
  return run(tests.language, `${delivered.code}\n\n${tests.code}`);
}

function reason(run) {
  const lines = run.output.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.findLast((line) => /^\w*Error\b/.test(line)) ?? lines.at(-1) ?? "";
}

function same(a, b) {
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return Object.is(a, b) || (typeof a === "number" && a === b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((value, index) => same(value, b[index]));
  const keys = Object.keys(a).sort();
  return same(keys, Object.keys(b).sort()) && keys.every((key) => same(a[key], b[key]));
}

function dataRun(item) {
  let value;
  try {
    value = JSON.parse(item.result);
  } catch {
    return { outcome: "failed", output: "the result is not JSON" };
  }
  if (same(value, item.oracle.record)) return { outcome: "passed", output: "" };
  const fields = Object.keys({ ...item.oracle.record, ...(value && typeof value === "object" ? value : {}) }).filter((key) => !same(value?.[key], item.oracle.record[key]));
  return { outcome: "failed", output: `differs in ${fields.join(", ") || "shape"}` };
}

async function judge(item) {
  const issues = problems(item);
  for (const { path, request } of requestsFor(item)) {
    const reason = refusal(request);
    if (reason) issues.push(`the grade route would refuse the ${path} request: ${reason}`);
  }
  if (item.kind === "data") {
    const oracle = dataRun(item);
    if ((oracle.outcome === "passed") !== (item.expected === "accept")) issues.push(`oracle ${oracle.outcome} but the case expects ${item.expected}: ${oracle.output}`);
    return { item, oracle, issues };
  }
  const [oracle, checks] = await Promise.all([codeRun(item, item.oracle), codeRun(item, item.checks)]);
  if ((oracle.outcome === "passed") !== (item.expected === "accept")) issues.push(`oracle ${oracle.outcome} but the case expects ${item.expected}: ${reason(oracle)}`);
  if (checks.outcome !== item.checksOutcome) issues.push(`checks ${checks.outcome} but the case says ${item.checksOutcome}: ${reason(checks)}`);
  return { item, oracle, checks, issues };
}

async function pool(items, worker, size) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

function heldOutIgnored() {
  const inside = spawnSync("git", ["-C", ROOT, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8" });
  if (inside.status !== 0) return true;
  return spawnSync("git", ["-C", ROOT, "check-ignore", "-q", `${SETS["held-out"]}/any/case/task.json`]).status === 0;
}

const sets = args.set ?? ["published", "held-out"];
const cases = loadCases(sets, args.family);
if (cases.length === 0) {
  console.error("no cases found");
  process.exit(1);
}

const failures = [];
const ids = new Map();
for (const item of cases) {
  if (ids.has(item.id)) failures.push(`${item.id}: duplicate id, also in ${relative(ROOT, ids.get(item.id))}`);
  ids.set(item.id, item.file);
}
if (!heldOutIgnored()) failures.push(`${SETS["held-out"]}/ is not ignored by git; it must never be committed`);

const results = await pool(cases, judge, Math.max(2, availableParallelism()));
for (const { item, issues } of results) for (const issue of issues) failures.push(`${item.id}: ${issue}`);

const count = (key) => Object.entries(Object.groupBy(cases, key)).map(([name, group]) => `${name} ${group.length}`).join(", ");
const weak = results.filter(({ item, checks }) => item.expected === "reject" && checks?.outcome === "passed").length;
const runs = results.reduce((total, { checks }) => total + (checks ? 2 : 0), 0);
console.log(`${cases.length} cases: ${count((item) => item.set)}`);
console.log(`kind: ${count((item) => item.kind)}; expected: ${count((item) => item.expected)}`);
console.log(`flaw: ${count((item) => item.flaw)}`);
console.log(`${runs} isolated runs; ${weak} wrong deliveries pass their checks and fail only the oracle`);
if (args.verbose) for (const { item, oracle, checks } of results) console.log(`${item.id}: oracle ${oracle.outcome}${checks ? `, checks ${checks.outcome}` : ""}${oracle.outcome === "passed" ? "" : `: ${reason(oracle)}`}`);

if (failures.length > 0) {
  console.error(`\n${failures.length} problems:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("every label holds");
