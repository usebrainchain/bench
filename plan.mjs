import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

import { familyTable, PRICE_UNITS, selectEntries } from "./lib/requests.mjs";

const USAGE = `node plan.mjs [--set published|held-out|all] [--path with-checks|without-checks|with-schema] [--family NAME]... [--case ID]... [--list] [--output plan.json]

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
const { entries: requests, problem } = selectEntries({ sets, families: args.family, cases: args.case, path: args.path });
if (problem) fail(problem);
const cases = new Set(requests.map((entry) => entry.case)).size;

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

console.log(familyTable(requests));
console.log(`\n${cases} cases (${args.set}), ${requests.length} grades at ${usd(PRICE_UNITS)} USD each: ${plan.plannedUsd} USD. Dry plan: nothing was signed or sent.`);

if (args.output) {
  try {
    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, `${JSON.stringify(plan, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  } catch (error) {
    fail(error.code === "EEXIST" ? `${args.output} exists; plans are written to a new file` : error.message);
  }
  console.log(`plan written to ${args.output}`);
}
