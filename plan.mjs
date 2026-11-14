import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

import { loadCases } from "./lib/cases.mjs";
import { PATHS, PRICE_UNITS, refusal, requestsFor } from "./lib/requests.mjs";

const USAGE = `node plan.mjs [--set published|held-out|all] [--path with-checks|without-checks] [--family NAME]... [--case ID]... [--list] [--output plan.json]

Builds the grade requests for one run and prints their count and cost. It never signs, pays or sends anything.`;

const { values: args } = parseArgs({
  options: {
    set: { type: "string", default: "published" },
    path: { type: "string" },
    family: { type: "string", multiple: true },
    case: { type: "string", multiple: true },
    list: { type: "boolean" },
    output: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

function fail(message) {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
}

if (args.help) {
  console.log(USAGE);
  process.exit(0);
}
const sets = { published: ["published"], "held-out": ["held-out"], all: ["published", "held-out"] }[args.set];
if (!sets) fail(`unknown set ${args.set}`);
if (args.path && !PATHS.includes(args.path)) fail(`unknown path ${args.path}`);

const cases = loadCases(sets, args.family).filter((item) => !args.case || args.case.includes(item.id));
const unknown = (args.case ?? []).filter((id) => !cases.some((item) => item.id === id));
if (unknown.length > 0) fail(`unknown case ${unknown.join(", ")}`);
if (cases.length === 0) fail("no cases selected");

const requests = cases.flatMap((item) =>
  requestsFor(item)
    .filter(({ path }) => !args.path || path === args.path)
    .map(({ path, request, payloadHash }) => ({
      case: item.id,
      set: item.set,
      family: item.family,
      kind: item.kind,
      flaw: item.flaw,
      expected: item.expected,
      ...(path === "with-checks" ? { checksOutcome: item.checksOutcome } : {}),
      path,
      payloadHash,
      request,
    })),
);
const refused = requests.map((entry) => [entry, refusal(entry.request)]).filter(([, reason]) => reason);
if (refused.length > 0) fail(refused.map(([entry, reason]) => `${entry.case} ${entry.path}: ${reason}`).join("\n"));

const usd = (units) => (Number(units) / 1e6).toFixed(2);
const units = PRICE_UNITS * BigInt(requests.length);
const plan = {
  version: 1,
  mode: "plan",
  runId: randomUUID(),
  createdAt: new Date().toISOString(),
  set: args.set,
  priceUnits: PRICE_UNITS.toString(),
  grades: requests.length,
  plannedUnits: units.toString(),
  plannedUsd: usd(units),
  requests,
};

if (args.list) for (const entry of requests) console.log(`${entry.case}  ${entry.path.padEnd(14)}  ${entry.expected.padEnd(6)}  ${entry.payloadHash.slice(0, 16)}`);

const rows = Object.entries(Object.groupBy(requests, (entry) => entry.family)).map(([family, group]) => {
  const count = (path) => group.filter((entry) => entry.path === path).length;
  return [family, new Set(group.map((entry) => entry.case)).size, count("with-checks"), count("without-checks"), group.length];
});
const header = ["family", "cases", "with checks", "without checks", "grades"];
const widths = header.map((title, index) => Math.max(title.length, ...rows.map((row) => String(row[index]).length)));
const line = (row) => row.map((cell, index) => (index === 0 ? String(cell).padEnd(widths[index]) : String(cell).padStart(widths[index]))).join("  ");
console.log([line(header), ...rows.map(line)].join("\n"));
console.log(`\n${cases.length} cases (${args.set}), ${requests.length} grades at ${usd(PRICE_UNITS)} USD each: ${plan.plannedUsd} USD. Dry plan: nothing was signed or sent.`);

if (args.output) {
  try {
    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, `${JSON.stringify(plan, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  } catch (error) {
    fail(error.code === "EEXIST" ? `${args.output} exists; plans are written to a new file` : error.message);
  }
  console.log(`plan written to ${args.output}`);
}
