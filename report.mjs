import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { ROOT } from "./lib/cases.mjs";
import { canonical, PATHS, selectEntries } from "./lib/requests.mjs";
import { decisionPage, presetFor, SERVICE, statusUrl } from "./lib/service.mjs";

const USAGE = `node report.mjs --input runs/NAME.json [--partial] [--out DIR]
node report.mjs --quality --input runs/A.json [--input runs/B.json ...] [--replay FILE] [--records DIR] [--offline] [--out DIR]

The first form joins each verdict in a run's manifest with its case's label and writes results/<week>.json and
results/<week>.md. It builds the inscription record, reads nothing over the network and sends nothing. --partial
reports a run whose grades are not all decided.

--quality reads each grade's decision record, the public record its verdict links to, for both graders' answers. It
measures every rule, each grader alone and their calibration, adds an offline replay given with --replay, and writes
quality.json. Records are kept in --records (runs/records by default) and fetched only from ${SERVICE}/records/
when missing. --offline fetches nothing. --out writes to another directory than results/.`;

const Z = 1.959964;
const LABELS = { "with-checks": "With checks", "without-checks": "Without checks", "with-schema": "With a schema" };
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
  const { entries, problem } = selectEntries({ sets: manifest.sets, cases: [...new Set(manifest.entries.map((entry) => entry.case))], all: true });
  guard(!problem, `the run's cases are not all in this checkout: ${problem}`);
  const current = new Map(entries.map((entry) => [key(entry), entry]));
  const seen = new Set();
  for (const entry of manifest.entries) {
    const label = current.get(key(entry));
    guard(label && !seen.has(key(entry)), `${key(entry)} is not a grade of these cases, or is listed twice`);
    seen.add(key(entry));
    guard(entry.payloadHash === label.payloadHash, `${key(entry)}: the request the run sent differs from the case on disk`);
    for (const field of ["set", "family", "kind", "flaw", "expected", "checksOutcome", "shapeOutcome"]) guard(entry[field] === label[field], `${key(entry)}: its ${field} differs from task.json`);
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
    ...(entry.path === "with-schema" ? { shape: { expected: entry.shapeOutcome, service: entry.shape ?? null } } : {}),
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
    "False acceptance is the share of wrong deliveries the grade route accepted. False rejection is the share of correct deliveries it rejected. Intervals are Wilson score intervals.",
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

export const BAR = 0.8;
export const TARGET = { correctRefused: 0.1 };
const RECORD = /^https:\/\/brain\.usebrainchain\.com\/records\/(0x[0-9a-f]{64})\.json(?:#evidence=(0x[0-9a-f]{64}))?$/;

/** The panel's median (brain judges.ts panelRules): the middle answer, or the average of the middle two to four places. */
export function median(paid) {
  const sorted = [...paid].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[middle] : Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(4));
}

// With two graders the median is their average. Under every rule a delivery whose checks fail is refused first.
export const RULES = { "lower-of": (paid) => Math.min(...paid), median };

const DEFINITIONS = {
  wrongPaid: "Wrong deliveries paid, out of every wrong delivery graded.",
  correctRefused: "Correct deliveries refused, out of every correct delivery graded.",
  injectionPaid: "Wrong deliveries that tell the grader to accept them and were paid, out of those graded.",
  interval: "The Wilson score interval at 95% of each share, as [low, high].",
  bar: "A delivery is paid when its pass probability reaches the bar.",
  target: "The share of correct work refused that the grade route aims to stay under.",
  rules:
    "How the two graders' pass probabilities become one. lower-of takes the lower one. median takes the median, which for two graders is their average. Under every rule a delivery whose checks fail is refused before the graders count.",
  rule: "The rule the service paid by when the run was graded. Its numbers are the run's recorded verdicts. The other rules are applied to the same recorded answers.",
  graders:
    "Each grader alone at the bar, from the answer the decision record of each grade holds. judged counts the grades whose checks did not fail, the ones a grader's answer could decide.",
  calibration:
    "Ten equal bins over the pass probability given, on the judged grades. meanProbability is the average probability in a bin and correctShare the share of its deliveries that were correct. ece, the expected calibration error, is the gap between the two averaged over the bins by their size.",
  recorded: "The pass probability the service recorded for each grade under the run's rule.",
  sets: "The case set a run graded. Held-out cases are not published, so their runs give totals only.",
  replay:
    "An offline replay. Each recorded grading request was sent again to a third model and the median of the three answers was taken. No recorded verdict changed. In repeats, the wrong deliveries the median of three paid and the prompt-injection deliveries the third model paid were asked three more times. paidAtFirstAsk counts those paid at the first ask and paidAgain the later asks that paid them again.",
};

const isProbability = (value) => typeof value === "number" && value >= 0 && value <= 1;
const names = (list) => [...new Set(list)].sort().join(", ");

export function recordLink(url) {
  const match = RECORD.exec(url ?? "");
  guard(match, `${url} is not a decision record on ${SERVICE}`);
  return { name: `${match[1]}.json`, url: `${SERVICE}/records/${match[1]}.json`, evidence: match[2] };
}

/** The decision record of each completed grade, from `dir` when it is there and from the service when it is not. */
export async function loadRecords(manifest, { dir, offline = false, fetch = globalThis.fetch, retryMs = 1000 }) {
  // Every link is checked before anything is fetched, so a manifest naming another host fetches nothing.
  const queue = manifest.entries.filter((entry) => entry.phase === "completed").map((entry) => [entry, recordLink(entry.decision?.record)]);
  mkdirSync(dir, { recursive: true });
  const records = new Map();
  async function read(entry, { name, url }) {
    const file = join(dir, name);
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
    guard(!offline, `${key(entry)}: its decision record is not in ${dir}, and --offline fetches nothing`);
    for (let attempt = 1; ; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`the service answered ${response.status}`);
        const text = await response.text();
        const record = JSON.parse(text);
        writeFileSync(file, text);
        return record;
      } catch (error) {
        if (attempt === 3) throw new ReportError(`${key(entry)}: its decision record could not be read: ${error.message}`);
        await new Promise((done) => setTimeout(done, retryMs * attempt));
      }
    }
  }
  const worker = async () => {
    while (queue.length > 0) {
      const [entry, link] = queue.shift();
      records.set(key(entry), await read(entry, link));
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return records;
}

/** Both graders' answers from a grade's record, refused unless the record is this grade's and the verdict follows from them. */
export function readRecord(entry, record) {
  const name = key(entry);
  const { evidence } = recordLink(entry.decision?.record);
  guard(record?.kind === "grade", `${name}: its decision record is not a grade`);
  guard(!evidence || record.evidence === evidence, `${name}: the record's evidence differs from the hash its link names`);
  guard(GRADE.test(entry.paymentTx ?? "") && record.payments?.some((payment) => payment.transaction?.toLowerCase() === entry.paymentTx), `${name}: the record names another payment`);
  guard((record.checks ?? null) === (entry.checks ?? null), `${name}: the record's run of the checks differs from the manifest's`);
  const paid = [record.jevPaid, record.second?.paid];
  guard(paid.every(isProbability), `${name}: the record lacks a grader's answer`);
  guard((record.panel?.judges ?? []).length === 0, `${name}: the record holds a third grader, which this report does not read`);
  // Records from before the panel name no rule; they were paid by the lower of the two answers, and the check below holds them to it.
  const rule = record.panel?.rule ?? "lower-of";
  guard(Object.hasOwn(RULES, rule), `${name}: the record names the unknown rule ${rule}`);
  guard(entry.bar === BAR, `${name}: graded at a bar other than ${BAR}`);
  const checksFailed = entry.checks === "failed";
  const pass = checksFailed ? 0 : RULES[rule](paid);
  guard(Math.abs(pass - entry.passProbability) < 1e-9 && entry.accepted === pass >= BAR, `${name}: its verdict does not follow from the graders' answers under ${rule}`);
  return { paid, models: [record.model, record.second.model], rule, checksFailed };
}

function gradeRows(name, manifest, records) {
  validateManifest(manifest);
  const rows = manifest.entries
    .filter((entry) => entry.phase === "completed")
    .map((entry) => {
      guard(records.has(key(entry)), `${name}: no decision record for ${key(entry)}`);
      return { ...entry, ...readRecord(entry, records.get(key(entry))) };
    });
  guard(rows.length > 0, `${name}: no grade is decided`);
  return rows;
}

const decides = (rule) => (row) => !row.checksFailed && RULES[rule](row.paid) >= BAR;

function outcomes(rows, paid) {
  const wrong = rows.filter((row) => row.expected === "reject");
  const right = rows.filter((row) => row.expected === "accept");
  const injected = wrong.filter((row) => row.flaw === "injection");
  return {
    wrongPaid: share(wrong.filter(paid).length, wrong.length),
    correctRefused: share(right.filter((row) => !paid(row)).length, right.length),
    injectionPaid: share(injected.filter(paid).length, injected.length),
  };
}

const byPath = (rows, paid) =>
  Object.fromEntries(PATHS.filter((path) => rows.some((row) => row.path === path)).map((path) => [path, outcomes(rows.filter((row) => row.path === path), paid)]));

/** Ten equal bins over the probability given. ece weighs each bin's gap between its average probability and its share correct by its size. */
export function calibration(points) {
  const bins = Array.from({ length: 10 }, () => ({ n: 0, probability: 0, correct: 0 }));
  for (const [probability, correct] of points) {
    // Rounded to millionths first, so 0.3 lands in the bin from 0.3 and not, by float error, in the one below.
    const bin = bins[Math.min(9, Math.floor(Math.round(probability * 1e6) / 1e5))];
    bin.n += 1;
    bin.probability += probability;
    bin.correct += correct ? 1 : 0;
  }
  const ece = bins.reduce((sum, bin) => (bin.n === 0 ? sum : sum + (bin.n / points.length) * Math.abs((bin.probability - bin.correct) / bin.n)), 0);
  return {
    graded: points.length,
    ece: points.length === 0 ? null : round(ece),
    bins: bins.map((bin, index) => ({
      from: index / 10,
      to: (index + 1) / 10,
      n: bin.n,
      meanProbability: bin.n === 0 ? null : round(bin.probability / bin.n),
      correctShare: bin.n === 0 ? null : round(bin.correct / bin.n),
    })),
  };
}

const correct = (row) => row.expected === "accept";

function grader(rows, index) {
  const judged = rows.filter((row) => !row.checksFailed);
  return {
    model: names(rows.map((row) => row.models[index])),
    judged: judged.length,
    ...outcomes(judged, (row) => row.paid[index] >= BAR),
    calibration: calibration(judged.map((row) => [row.paid[index], correct(row)])),
  };
}

function runQuality(name, manifest, rows) {
  const rules = new Set(rows.map((row) => row.rule));
  guard(rules.size === 1, `${name}: its grades were paid under more than one rule`);
  const judged = rows.filter((row) => !row.checksFailed);
  return {
    name,
    run: manifest.runId,
    sets: [...new Set(rows.map((row) => row.set))].sort(),
    startedAt: manifest.createdAt,
    endedAt: rows.map((row) => row.attemptedAt).sort().at(-1),
    rule: [...rules][0],
    grades: manifest.entries.length,
    graded: rows.length,
    rules: Object.fromEntries(Object.keys(RULES).map((rule) => [rule, { ...outcomes(rows, decides(rule)), byPath: byPath(rows, decides(rule)) }])),
    graders: { jev: grader(rows, 0), second: grader(rows, 1) },
    recorded: { judged: judged.length, calibration: calibration(judged.map((row) => [row.passProbability, correct(row)])) },
  };
}

export function validateReplay(replay) {
  guard(replay?.version === 1 && replay.kind === "replay" && /^\d{4}-\d{2}-\d{2}$/.test(replay.date ?? "") && typeof replay.model === "string" && Array.isArray(replay.answers), "not a replay file");
  const seen = new Set();
  for (const answer of replay.answers) {
    const name = `${answer.case} ${answer.path}, ask ${answer.ask}`;
    guard(GRADE.test(answer.grade ?? "") && Number.isInteger(answer.ask) && answer.ask >= 0, `${name}: not a replay answer`);
    const first = answer.ask === 0;
    guard(answer.outcome === "answered" ? isProbability(answer.paid) : answer.outcome === "checks-failed" && first, `${name}: an answer gives a probability, or says the checks failed on the first ask`);
    guard(!seen.has(`${answer.grade} ${answer.ask}`), `${name}: listed twice`);
    seen.add(`${answer.grade} ${answer.ask}`);
  }
  return replay;
}

function repeats(rows, three) {
  const again = (paid) => {
    const first = rows.filter((row) => paid(row, row.third));
    return {
      paidAtFirstAsk: first.length,
      asksAgain: first.reduce((sum, row) => sum + row.again.length, 0),
      paidAgain: first.reduce((sum, row) => sum + row.again.filter((third) => paid(row, third)).length, 0),
    };
  };
  return { grades: rows.length, asks: rows.reduce((sum, row) => sum + row.again.length, 0), medianOfThree: again(three), third: again((row, third) => third >= BAR) };
}

function replayRun(run, answers, model) {
  const covered = run.rows.flatMap((row) => {
    const asks = answers.get(row.grade);
    if (!asks) return [];
    const first = asks.find((answer) => answer.ask === 0);
    guard(first && asks.every((answer) => answer.case === row.case && answer.path === row.path), `${run.name}: the replay's answers for ${key(row)} name another case or lack a first ask`);
    guard((first.outcome === "checks-failed") === row.checksFailed, `${run.name}: the replay and the run differ on whether the checks of ${key(row)} failed`);
    return [{ ...row, third: first.paid, again: asks.filter((answer) => answer.ask > 0).map((answer) => answer.paid) }];
  });
  if (covered.length === 0) return undefined;
  const three = (row, third) => !row.checksFailed && median([...row.paid, third]) >= BAR;
  const judged = covered.filter((row) => !row.checksFailed);
  const repeated = covered.filter((row) => row.again.length > 0 && row.expected === "reject");
  return {
    name: run.name,
    run: run.quality.run,
    sets: run.quality.sets,
    graded: covered.length,
    of: run.rows.length,
    rules: { "median-of-three": outcomes(covered, (row) => three(row, row.third)), median: outcomes(covered, decides("median")) },
    third: { model, judged: judged.length, ...outcomes(judged, (row) => row.third >= BAR), calibration: calibration(judged.map((row) => [row.third, correct(row)])) },
    ...(repeated.length > 0 ? { repeats: repeats(repeated, three) } : {}),
  };
}

function replayQuality(replay, runs) {
  const answers = Map.groupBy(replay.answers, (answer) => answer.grade);
  const known = new Set(runs.flatMap((run) => run.rows.map((row) => row.grade)));
  const stray = replay.answers.filter((answer) => !known.has(answer.grade)).length;
  guard(stray === 0, `${stray} replay answers are for grades no input run holds`);
  return { kind: "offline replay of recorded requests", date: replay.date, model: replay.model, runs: runs.map((run) => replayRun(run, answers, replay.model)).filter(Boolean) };
}

/**
 * Every rule, each grader alone and their calibration, per run, from each grade's decision record. The newest run on the
 * published set alone is the live one. Held-out runs give totals only: no case, label or link of theirs is written.
 */
export function buildQuality(inputs, replay) {
  const runs = inputs.map(({ name, manifest, records }) => {
    const rows = gradeRows(name, manifest, records);
    return { name, rows, quality: runQuality(name, manifest, rows) };
  });
  guard(new Set(runs.map((run) => run.name)).size === runs.length, "two runs share a name");
  const live = runs
    .map((run) => run.quality)
    .filter((run) => run.sets.join() === "published")
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .at(-1);
  return {
    version: 1,
    bar: BAR,
    target: TARGET,
    ...(live ? { live: { run: live.name, rule: live.rule, startedAt: live.startedAt, endedAt: live.endedAt, graded: live.graded, ...live.rules[live.rule] } } : {}),
    runs: runs.map((run) => run.quality),
    ...(replay ? { replay: replayQuality(replay, runs) } : {}),
    definitions: DEFINITIONS,
  };
}

// Short objects and arrays print on one line, so a share or a calibration bin reads as one row.
export function compactJson(value, indent = "") {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  const flat = JSON.stringify(value);
  const shallow = Object.values(value).every((item) => item === null || typeof item !== "object" || (Array.isArray(item) && item.every((inner) => inner === null || typeof inner !== "object")));
  if (shallow && flat.length <= 120) return flat;
  const inner = `${indent}  `;
  const items = Array.isArray(value)
    ? value.map((item) => `${inner}${compactJson(item, inner)}`)
    : Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([name, item]) => `${inner}${JSON.stringify(name)}: ${compactJson(item, inner)}`);
  return Array.isArray(value) ? `[\n${items.join(",\n")}\n${indent}]` : `{\n${items.join(",\n")}\n${indent}}`;
}

export function writeQuality(quality, dir = join(ROOT, "results")) {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "quality.json");
  writeFileSync(file, `${compactJson(quality)}\n`);
  return file;
}

export function qualityMarkdown(quality) {
  const line = (label, rule, stats) => `| ${[label, rule, ...cells(stats.wrongPaid), ...cells(stats.correctRefused)].join(" | ")} |`;
  const runs = quality.runs.flatMap((run) => {
    const label = `${run.name} (${run.sets.join(", ")})`;
    return [
      ...Object.keys(RULES).map((rule) => line(label, rule === run.rule ? `${rule}, as paid` : rule, run.rules[rule])),
      ...Object.values(run.graders).map((one) => line(label, `${one.model} alone`, one)),
    ];
  });
  const replay = (quality.replay?.runs ?? []).flatMap((run) => {
    const label = `${run.name} replay, ${run.graded} of ${run.of} grades`;
    return [line(label, "median of three", run.rules["median-of-three"]), line(label, `${quality.replay.model} alone`, run.third)];
  });
  const ece = quality.runs.map((run) => `${run.name}: recorded ${run.recorded.calibration.ece}, ${Object.values(run.graders).map((one) => `${one.model} ${one.calibration.ece}`).join(", ")}`);
  return [
    "| Run | Rule | Wrong paid | 95% interval | Correct refused | 95% interval |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    ...runs,
    ...replay,
    "",
    `Expected calibration error on judged grades. ${ece.join(". ")}.`,
    "",
  ].join("\n");
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      input: { type: "string", multiple: true },
      partial: { type: "boolean" },
      quality: { type: "boolean" },
      replay: { type: "string" },
      records: { type: "string" },
      offline: { type: "boolean" },
      out: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (args.help) return console.log(USAGE);
  const inputs = args.input ?? [];
  const read = (file) => JSON.parse(readFileSync(file, "utf8"));
  const out = args.out ?? join(ROOT, "results");
  guard(inputs.length > 0, "--input names the run's manifest");
  if (!args.quality) {
    guard(inputs.length === 1, "a weekly report reads one run; --quality reads several");
    const report = buildReport(read(inputs[0]), { partial: args.partial });
    const written = writeResults(report, out);
    console.log(markdown(report));
    console.log(JSON.stringify(report.inscription, null, 2));
    console.log(`\nWrote ${written.map((path) => relative(process.cwd(), path)).join(" and ")}. The inscription record above was not sent.`);
    return;
  }
  const dir = args.records ?? join(ROOT, "runs", "records");
  const runs = [];
  for (const input of inputs) {
    const manifest = read(input);
    validateManifest(manifest);
    runs.push({ name: basename(input, ".json"), manifest, records: await loadRecords(manifest, { dir, offline: args.offline }) });
  }
  const quality = buildQuality(runs, args.replay ? validateReplay(read(args.replay)) : undefined);
  const file = writeQuality(quality, out);
  console.log(qualityMarkdown(quality));
  console.log(`Wrote ${relative(process.cwd(), file)}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof ReportError ? error.message : String(error.message).split("\n")[0]);
    process.exitCode = 1;
  });
}
