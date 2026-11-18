import { createHash } from "node:crypto";

import { LIMITS, loadCases } from "./cases.mjs";

export const PRICE_UNITS = 250_000n;
export const PATHS = ["with-checks", "without-checks", "with-schema"];
// A run measures these unless --path names another. with-schema joins them once the grade route checks a schema.
export const DEFAULT_PATHS = ["with-checks", "without-checks"];
const MAX_SCHEMA = 8_000;

const CHECK_FENCE = /```(?:python|py|python3|javascript|js|mjs|node)[^\S\n]+checks[^\S\n]*\n/i;

export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

/** What the grade route would answer with a 400 before asking for payment (brain parseGradeRequest), or undefined. */
export function refusal({ title, brief, result, levels, pass, checks, schema }) {
  if (title !== undefined && (typeof title !== "string" || title.length > LIMITS.title)) return `title is up to ${LIMITS.title} characters`;
  if (typeof brief !== "string" || brief.trim().length === 0 || brief.length > LIMITS.brief) return `brief must be 1 to ${LIMITS.brief} characters`;
  if (typeof result !== "string" || result.trim().length === 0) return "result must be the delivered work";
  if (Buffer.byteLength(result) > LIMITS.resultBytes) return `result can be at most ${LIMITS.resultBytes} bytes`;
  const levelsOk = Array.isArray(levels) && levels.length >= LIMITS.minLevels && levels.length <= LIMITS.maxLevels && levels.every((level) => typeof level === "string" && level.trim().length > 0 && level.length <= LIMITS.level);
  if (!levelsOk) return `levels lists ${LIMITS.minLevels} to ${LIMITS.maxLevels} levels of up to ${LIMITS.level} characters`;
  if (!Number.isInteger(pass) || pass < 0 || pass > levels.length - 2) return "pass names a level above the lowest";
  if (CHECK_FENCE.test(brief)) return "brief carries checks of its own";
  if (schema !== undefined) {
    if (schema === null || typeof schema !== "object" || Array.isArray(schema)) return "schema is a JSON Schema object";
    if (JSON.stringify(schema).length > MAX_SCHEMA) return `schema can be at most ${MAX_SCHEMA} characters as JSON`;
    if (/```json[^\S\n]+schema[^\S\n]*\n/i.test(brief)) return "brief carries a schema of its own";
  }
  if (checks === undefined) return undefined;
  const { language, code } = checks;
  if (!["python", "javascript"].includes(language) || typeof code !== "string" || code.trim().length === 0 || code.length > LIMITS.checks || code.includes("```")) return `checks are python or javascript code of 1 to ${LIMITS.checks} characters with no code fence`;
  if (result.length + code.length > LIMITS.program) return `result and checks can be at most ${LIMITS.program} characters together`;
  return undefined;
}

/** The grade requests a case is measured with: with and without its checks for code, with and without its schema for data. */
export function requestsFor(item) {
  const base = { title: item.title, brief: item.brief, result: item.result, levels: [...item.levels], pass: item.pass };
  const paths =
    item.kind === "code"
      ? [["with-checks", { ...base, checks: { ...item.checks } }], ["without-checks", base]]
      : [["without-checks", base], ["with-schema", { ...base, schema: item.schema }]];
  return paths.map(([path, request]) => ({ path, request, payloadHash: createHash("sha256").update(canonical(request)).digest("hex") }));
}

/** One grade per path a case is measured on, carrying the labels its verdict is compared with. */
export function entriesFor(item) {
  return requestsFor(item).map(({ path, request, payloadHash }) => ({
    case: item.id,
    set: item.set,
    family: item.family,
    kind: item.kind,
    flaw: item.flaw,
    expected: item.expected,
    ...(path === "with-checks" ? { checksOutcome: item.checksOutcome } : {}),
    ...(path === "with-schema" ? { shapeOutcome: item.shapeOutcome } : {}),
    path,
    payloadHash,
    request,
  }));
}

/** The grades a run of these sets, families, cases and path sends, or the problem with the selection. `all` takes every path, to read back a run. */
export function selectEntries({ sets, families, cases: ids, path, all = false }) {
  if (path && !PATHS.includes(path)) return { problem: `unknown path ${path}` };
  const cases = loadCases(sets, families).filter((item) => !ids || ids.includes(item.id));
  const unknown = (ids ?? []).filter((id) => !cases.some((item) => item.id === id));
  if (unknown.length > 0) return { problem: `unknown case ${unknown.join(", ")}` };
  const entries = cases.flatMap(entriesFor).filter((entry) => (path ? entry.path === path : all || DEFAULT_PATHS.includes(entry.path)));
  if (entries.length === 0) return { problem: "no grades selected" };
  const refused = entries.map((entry) => [entry, refusal(entry.request)]).filter(([, reason]) => reason);
  if (refused.length > 0) return { problem: refused.map(([entry, reason]) => `${entry.case} ${entry.path}: ${reason}`).join("\n") };
  return { entries };
}

export function familyTable(entries) {
  const rows = Object.entries(Object.groupBy(entries, (entry) => entry.family)).map(([family, group]) => {
    const count = (path) => group.filter((entry) => entry.path === path).length;
    return [family, new Set(group.map((entry) => entry.case)).size, count("with-checks"), count("without-checks"), count("with-schema"), group.length];
  });
  const header = ["family", "cases", "with checks", "without checks", "with schema", "grades"];
  const widths = header.map((title, index) => Math.max(title.length, ...rows.map((row) => String(row[index]).length)));
  const line = (row) => row.map((cell, index) => (index === 0 ? String(cell).padEnd(widths[index]) : String(cell).padStart(widths[index]))).join("  ");
  return [line(header), ...rows.map(line)].join("\n");
}
