import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { ROOT } from "./lib/cases.mjs";
import { canonical, PATHS, selectEntries } from "./lib/requests.mjs";
import { decisionPage, presetFor, statusUrl } from "./lib/service.mjs";

const USAGE = `node report.mjs --input runs/NAME.json [--partial]

Joins each verdict in a run's manifest with its case's label and writes results/<week>.json and results/<week>.md.
It builds the inscription record and sends nothing. --partial reports a run whose grades are not all decided.`;

const Z = 1.959964;
const LABELS = { "with-checks": "With checks", "without-checks": "Without checks" };
const GRADE = /^0x[0-9a-f]{64}$/;

class ReportError extends Error {}
const guard = (condition, message) => {
  if (!condition) throw new ReportError(message);
};
const round = (value) => Math.round(value * 10_000) / 10_000;
const key = (entry) => `${entry.case} ${entry.path}`;
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** The Wilson score interval at 95%, which stays inside 0 and 1 and is honest about small counts. */
export function wilson(count, of) {
  if (of === 0) return null;
  const p = count / of;
  const z2 = Z * Z;
  const scale = 1 + z2 / of;
  const centre = (p + z2 / (2 * of)) / scale;
  const half = (Z / scale) * Math.sqrt((p * (1 - p)) / of + z2 / (4 * of * of));
  return [round(Math.max(0, centre - half)), round(Math.min(1, centre + half))];
}

export function isoWeek(iso) {
  const date = new Date(iso);
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7)));
  const week = 1 + Math.floor((thursday - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / 604_800_000);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** A run is measured against the cases as they are on disk, so a changed request or label refuses the report. */
export function validateManifest(manifest) {
  guard(manifest?.version === 1 && manifest.mode === "execute" && Array.isArray(manifest.entries) && manifest.entries.length > 0, "not a run manifest");
  guard(canonical(manifest.preset) === canonical(presetFor(manifest.preset?.payOn)), "the run was paid on terms this report does not know");
  guard(Array.isArray(manifest.sets) && manifest.sets.length > 0 && manifest.sets.every((set) => ["published", "held-out"].includes(set)), "the manifest names no case sets");
  guard(!Number.isNaN(Date.parse(manifest.createdAt)), "the manifest has no start time");
  const { entries, problem } = selectEntries({ sets: manifest.sets, cases: [...new Set(manifest.entries.map((entry) => entry.case))] });
  guard(!problem, `the run's cases are not all in this checkout: ${problem}`);
  const current = new Map(entries.map((entry) => [key(entry), entry]));
  const seen = new Set();
  for (const entry of manifest.entries) {
    const label = current.get(key(entry));
    guard(label && !seen.has(key(entry)), `${key(entry)} is not a grade of these cases, or is listed twice`);
    seen.add(key(entry));
    guard(entry.payloadHash === label.payloadHash, `${key(entry)}: the request the run sent differs from the case on disk`);
    for (const field of ["set", "family", "kind", "flaw", "expected", "checksOutcome"]) guard(entry[field] === label[field], `${key(entry)}: its ${field} differs from task.json`);
    if (entry.phase !== "completed") continue;
    guard(GRADE.test(entry.grade ?? "") && typeof entry.accepted === "boolean" && /^\d{1,20}$/.test(entry.decision?.id ?? ""), `${key(entry)}: the verdict is incomplete`);
  }
}

function share(count, of) {
  return { count, of, rate: of === 0 ? null : round(count / of), interval: wilson(count, of) };
}

function rates(group) {
  const rejects = group.filter((entry) => entry.expected === "reject");
  const accepts = group.filter((entry) => entry.expected === "accept");
  return {
    graded: group.length,
    falseAcceptance: share(rejects.filter((entry) => entry.accepted).length, rejects.length),
    falseRejection: share(accepts.filter((entry) => !entry.accepted).length, accepts.length),
  };
}

const breakdown = (group, field) =>
  Object.fromEntries(
    Object.entries(Object.groupBy(group, (entry) => entry[field]))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => [name, rates(items)]),
  );

function row(entry) {
  const outcome = entry.accepted === (entry.expected === "accept") ? "correct" : entry.accepted ? "false acceptance" : "false rejection";
  return {
    case: entry.case,
    path: entry.path,
    family: entry.family,
    kind: entry.kind,
    flaw: entry.flaw,
    expected: entry.expected,
    accepted: entry.accepted,
    outcome,
    passProbability: entry.passProbability,
    bar: entry.bar,
    ...(entry.path === "with-checks" ? { checks: { expected: entry.checksOutcome, service: entry.checks ?? null } } : {}),
    status: statusUrl(entry.grade),
    decision: { id: entry.decision.id, page: decisionPage(entry.decision.id), record: entry.decision.record },
  };
}

const counted = ({ count, of, rate }) => ({ count, of, rate });

function inscription({ week, run, paths }) {
  return {
    brainchain: 1,
    kind: "bench",
    week,
    run: run.id,
    ...(run.commit ? { commit: run.commit } : {}),
    sets: run.sets,
    requests: run.requests,
    grades: run.grades,
    graded: run.graded,
    paths: Object.fromEntries(
      Object.entries(paths).map(([path, stats]) => [path, { graded: stats.graded, falseAcceptance: counted(stats.falseAcceptance), falseRejection: counted(stats.falseRejection) }]),
    ),
  };
}

export function buildReport(manifest, { partial = false } = {}) {
  validateManifest(manifest);
  const decided = manifest.entries.filter((entry) => entry.phase === "completed");
  const rest = manifest.entries.filter((entry) => entry.phase !== "completed");
  const phases = Object.entries(Object.groupBy(rest, (entry) => entry.phase)).map(([phase, group]) => `${group.length} ${phase.replaceAll("_", " ")}`);
  guard(partial || rest.length === 0, `${rest.length} of ${manifest.entries.length} grades are not decided (${phases.join(", ")}). --resume reads pending grades; --partial reports the decided ones and lists the rest`);
  guard(decided.length > 0, "no grade in this run is decided");
  const paths = Object.fromEntries(
    PATHS.filter((path) => decided.some((entry) => entry.path === path)).map((path) => {
      const group = decided.filter((entry) => entry.path === path);
      const bySet = manifest.sets.length > 1 ? { bySet: breakdown(group, "set") } : {};
      return [path, { ...rates(group), byKind: breakdown(group, "kind"), byFamily: breakdown(group, "family"), ...bySet }];
    }),
  );
  const run = {
    id: manifest.runId,
    createdAt: manifest.createdAt,
    commit: manifest.commit ?? null,
    sets: manifest.sets,
    route: manifest.preset.endpoint,
    paidOn: manifest.preset.network,
    token: manifest.preset.token,
    priceUnits: manifest.preset.priceUnits,
    grades: manifest.entries.length,
    graded: decided.length,
    requests: sha256(manifest.entries.map((entry) => `${key(entry)} ${entry.payloadHash}`).sort().join("\n")),
  };
  // A held-out case's id, label or decision would let anyone learn its label before it rotates out, so it counts in the rates only.
  const published = decided.filter((entry) => entry.set === "published");
  const report = {
    version: 1,
    week: isoWeek(manifest.createdAt),
    run,
    paths,
    cases: published.map(row),
    ...(published.length < decided.length ? { heldOutGraded: decided.length - published.length } : {}),
    ...(rest.length > 0 ? { ungraded: rest.filter((entry) => entry.set === "published").map((entry) => ({ case: entry.case, path: entry.path, phase: entry.phase })) } : {}),
  };
  return { ...report, inscription: inscription(report) };
}

// Two decimals of a percent are the four decimals the JSON and the inscription hold, so the table never rounds them again.
const percent = (value) => `${(Math.round(value * 10_000) / 100).toFixed(2)}%`;
const cells = ({ count, of, rate, interval }) => (of === 0 ? ["none expected", ""] : [`${count} of ${of} (${percent(rate)})`, `${percent(interval[0])} to ${percent(interval[1])}`]);

export function markdown(report) {
  const rows = Object.entries(report.paths).flatMap(([path, stats]) => {
    const kinds = Object.entries(stats.byKind);
    return [[LABELS[path], stats], ...(kinds.length > 1 ? kinds.map(([kind, group]) => [`${LABELS[path]}, ${kind}`, group]) : [])];
  });
  return [
    `# ${report.week}`,
    "",
    `${report.run.graded} of ${report.run.grades} grades decided in run ${report.run.id}, on the ${report.run.sets.join(" and ")} cases.`,
    "",
    "| Path | Graded | False acceptance | 95% interval | False rejection | 95% interval |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map(([label, stats]) => `| ${[label, stats.graded, ...cells(stats.falseAcceptance), ...cells(stats.falseRejection)].join(" | ")} |`),
    "",
    "False acceptance is the share of wrong deliveries Jev accepted. False rejection is the share of correct deliveries it rejected. Intervals are Wilson score intervals.",
    "",
  ].join("\n");
}

export function writeResults(report, dir = join(ROOT, "results")) {
  const json = join(dir, `${report.week}.json`);
  const table = join(dir, `${report.week}.md`);
  guard(!existsSync(json) && !existsSync(table), `results for ${report.week} exist; each week is written once`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(json, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  writeFileSync(table, markdown(report), { flag: "wx" });
  return [json, table];
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values: args } = parseArgs({ options: { input: { type: "string" }, partial: { type: "boolean" }, help: { type: "boolean", short: "h" } } });
    if (args.help) {
      console.log(USAGE);
    } else {
      guard(args.input, "--input names the run's manifest");
      const report = buildReport(JSON.parse(readFileSync(args.input, "utf8")), { partial: args.partial });
      const written = writeResults(report);
      console.log(markdown(report));
      console.log(JSON.stringify(report.inscription, null, 2));
      console.log(`\nWrote ${written.map((path) => relative(ROOT, path)).join(" and ")}. The inscription record above was not sent.`);
    }
  } catch (error) {
    console.error(error instanceof ReportError ? error.message : String(error.message).split("\n")[0]);
    process.exitCode = 1;
  }
}
