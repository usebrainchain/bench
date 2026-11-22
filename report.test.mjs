import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadCases } from "./lib/cases.mjs";
import {
  buildQuality,
  buildReport,
  calibration,
  compactJson,
  isoWeek,
  loadRecords,
  markdown,
  median,
  qualityMarkdown,
  readRecord,
  validateManifest,
  validateReplay,
  wilson,
  writeQuality,
  writeResults,
} from "./report.mjs";
import { planRun } from "./run.mjs";

const PAYER = `0x${"ab".repeat(20)}`;
const STARTED = Date.parse("2026-11-16T09:00:00Z");
const EDIT = ["a", "b", "c", "d"].map((letter) => `algorithms-edit-distance-${letter}`);
const INVOICES = ["a", "b", "c", "d"].map((letter) => `invoices-catering-${letter}`);
const hex = (number) => `0x${number.toString(16).padStart(64, "0")}`;

// Edit distance: a and c are wrong, b and d are right. Invoices: b and c are wrong, a and d are right.
const VERDICTS = {
  "algorithms-edit-distance-a with-checks": false,
  "algorithms-edit-distance-b with-checks": true,
  "algorithms-edit-distance-c with-checks": true,
  "algorithms-edit-distance-d with-checks": false,
  "algorithms-edit-distance-a without-checks": false,
  "algorithms-edit-distance-b without-checks": true,
  "algorithms-edit-distance-c without-checks": false,
  "algorithms-edit-distance-d without-checks": true,
  "invoices-catering-a without-checks": true,
  "invoices-catering-b without-checks": true,
  "invoices-catering-c without-checks": false,
  "invoices-catering-d without-checks": false,
};
const RAN = { "algorithms-edit-distance-a": "failed", "algorithms-edit-distance-b": "passed", "algorithms-edit-distance-c": "passed", "algorithms-edit-distance-d": "passed" };

function complete(entry, index, accepted) {
  Object.assign(entry, {
    phase: "completed",
    attemptedAt: new Date(STARTED + index * 1000).toISOString(),
    grade: hex(index + 1),
    state: "graded",
    paymentTx: hex(index + 101),
    accepted,
    answer: accepted ? "accept" : "reject",
    passProbability: accepted ? 0.91 : 0.12,
    bar: 0.8,
    confidence: accepted ? 0.91 : 0.88,
    ...(entry.path === "with-checks" ? { checks: RAN[entry.case] } : {}),
    decision: { id: String(5000 + index), page: `https://usebrainchain.com/decision?id=${5000 + index}`, record: `https://brain.usebrainchain.com/records/${hex(index + 201)}.json` },
  });
}

function fixture(options = { cases: [...EDIT, ...INVOICES] }, verdict = (entry) => VERDICTS[`${entry.case} ${entry.path}`]) {
  const plan = planRun(options, () => STARTED);
  const manifest = { ...plan, mode: "execute", budgetUnits: plan.plannedUnits, reservedUnits: plan.plannedUnits, payer: PAYER, balanceUnits: "987654321" };
  manifest.entries.forEach((entry, index) => complete(entry, index, verdict(entry)));
  return manifest;
}

test("false acceptance and false rejection are counted per path, kind and family, with Wilson intervals", () => {
  const report = buildReport(fixture());
  assert.equal(report.week, "2026-W47");
  assert.deepEqual(Object.keys(report.paths), ["with-checks", "without-checks"]);
  const checks = report.paths["with-checks"];
  assert.equal(checks.graded, 4);
  assert.deepEqual(checks.falseAcceptance, { count: 1, of: 2, rate: 0.5, interval: [0.0945, 0.9055] });
  assert.deepEqual(checks.falseRejection, { count: 1, of: 2, rate: 0.5, interval: [0.0945, 0.9055] });
  assert.deepEqual(Object.keys(checks.byKind), ["code"]);
  const plain = report.paths["without-checks"];
  assert.equal(plain.graded, 8);
  assert.deepEqual(plain.falseAcceptance, { count: 1, of: 4, rate: 0.25, interval: [0.0456, 0.6994] });
  assert.deepEqual(plain.falseRejection, { count: 1, of: 4, rate: 0.25, interval: [0.0456, 0.6994] });
  assert.deepEqual(plain.byKind.code.falseAcceptance, { count: 0, of: 2, rate: 0, interval: [0, 0.6576] });
  assert.deepEqual(plain.byKind.data.falseRejection, { count: 1, of: 2, rate: 0.5, interval: [0.0945, 0.9055] });
  assert.deepEqual(Object.keys(plain.byFamily), ["algorithms", "invoices"]);
  assert.equal(plain.byFamily.invoices.falseAcceptance.count, 1);
  assert.equal(plain.bySet, undefined);
});

test("each case links its decision page, and its checks run sits beside the label", () => {
  const report = buildReport(fixture());
  assert.equal(report.cases.length, 12);
  const [first] = report.cases;
  assert.deepEqual(first, {
    case: "algorithms-edit-distance-a",
    path: "with-checks",
    family: "algorithms",
    kind: "code",
    flaw: "off-task",
    expected: "reject",
    accepted: false,
    outcome: "correct",
    passProbability: 0.12,
    bar: 0.8,
    checks: { expected: "failed", service: "failed" },
    status: `https://brain.usebrainchain.com/x402/grades/${hex(1)}`,
    decision: { id: "5000", page: "https://usebrainchain.com/decision?id=5000", record: `https://brain.usebrainchain.com/records/${hex(201)}.json` },
  });
  const outcomes = Object.groupBy(report.cases, (row) => row.outcome);
  assert.deepEqual(outcomes["false acceptance"].map((row) => `${row.case} ${row.path}`), ["algorithms-edit-distance-c with-checks", "invoices-catering-b without-checks"]);
  assert.deepEqual(outcomes["false rejection"].map((row) => `${row.case} ${row.path}`), ["algorithms-edit-distance-d with-checks", "invoices-catering-d without-checks"]);
  assert.ok(report.cases.filter((row) => row.path === "without-checks").every((row) => !("checks" in row)));
});

test("a with-schema run reads back against the cases, and its schema check sits beside the label", () => {
  const manifest = fixture({ cases: INVOICES, path: "with-schema" }, (entry) => entry.shapeOutcome === "passed" && entry.flaw === "none");
  for (const entry of manifest.entries) entry.shape = entry.shapeOutcome;
  const report = buildReport(manifest);
  assert.deepEqual(Object.keys(report.paths), ["with-schema"]);
  assert.deepEqual(report.cases.map((row) => row.shape), ["passed", "passed", "failed", "passed"].map((expected) => ({ expected, service: expected })));
  assert.equal(report.paths["with-schema"].graded, 4);
  const changed = structuredClone(manifest);
  changed.entries[2].shapeOutcome = "passed";
  assert.throws(() => validateManifest(changed), /its shapeOutcome differs from task.json/);
});

test("the inscription record holds totals and rates only", () => {
  const manifest = fixture();
  const report = buildReport(manifest);
  const record = report.inscription;
  assert.deepEqual(Object.keys(record), ["brainchain", "kind", "week", "run", "commit", "sets", "requests", "grades", "graded", "paths"].filter((name) => name !== "commit" || manifest.commit));
  assert.equal(record.brainchain, 1);
  assert.equal(record.kind, "bench");
  assert.equal(record.grades, 12);
  assert.equal(record.graded, 12);
  assert.match(record.requests, /^[0-9a-f]{64}$/);
  assert.deepEqual(record.paths["with-checks"], { graded: 4, falseAcceptance: { count: 1, of: 2, rate: 0.5 }, falseRejection: { count: 1, of: 2, rate: 0.5 } });
  for (const [path, stats] of Object.entries(record.paths)) {
    assert.equal(stats.falseAcceptance.rate, report.paths[path].falseAcceptance.rate);
    assert.equal(stats.falseRejection.rate, report.paths[path].falseRejection.rate);
  }
  const text = JSON.stringify(record);
  for (const absent of ["edit-distance", "catering", "decision", PAYER, "987654321"]) assert.equal(text.includes(absent), false, absent);
  assert.ok(Buffer.byteLength(text) < 1024);
  assert.equal(JSON.stringify(report).includes(PAYER), false);
});

test("a run whose requests, labels or terms differ from the cases on disk is refused", () => {
  assert.doesNotThrow(() => validateManifest(fixture()));
  for (const [change, message] of [
    [(m) => { m.entries[0].payloadHash = "0".repeat(64); }, /request the run sent differs/],
    [(m) => { m.entries[0].expected = "accept"; }, /expected differs from task\.json/],
    [(m) => { m.entries[1].flaw = "bug"; }, /flaw differs/],
    [(m) => { m.entries[0].checksOutcome = "passed"; }, /checksOutcome differs/],
    [(m) => { m.entries.push(structuredClone(m.entries[0])); }, /listed twice/],
    [(m) => { m.entries[0].case = "algorithms-edit-distance-z"; }, /not all in this checkout/],
    [(m) => { m.preset.payTo = PAYER; }, /terms this report does not know/],
    [(m) => { m.sets = ["everything"]; }, /no case sets/],
    [(m) => { m.mode = "plan"; }, /not a run manifest/],
    [(m) => { delete m.entries[2].decision; }, /verdict is incomplete/],
  ]) {
    const manifest = fixture();
    change(manifest);
    assert.throws(() => buildReport(manifest), message);
  }
});

test("undecided grades refuse the report unless it is partial, and a partial report says so", () => {
  const manifest = fixture();
  Object.assign(manifest.entries[11], { phase: "pending", state: "paid" });
  for (const field of ["accepted", "answer", "passProbability", "bar", "confidence", "decision"]) delete manifest.entries[11][field];
  assert.throws(() => buildReport(manifest), /1 of 12 grades are not decided \(1 pending\)\. --resume reads pending grades/);
  const report = buildReport(manifest, { partial: true });
  assert.equal(report.run.graded, 11);
  assert.deepEqual(report.ungraded, [{ case: "invoices-catering-d", path: "without-checks", phase: "pending" }]);
  assert.equal(report.inscription.graded, 11);
  assert.equal(report.inscription.grades, 12);
  assert.equal(report.paths["without-checks"].falseRejection.of, 3);
});

test("held-out grades count in the rates and never appear by name", (t) => {
  const [task] = Object.values(Object.groupBy(loadCases(["held-out"]), (item) => `${item.family}-${item.task}`));
  if (!task) return t.skip("held-out/ holds no cases in this checkout");
  const ids = [...EDIT, ...task.map((item) => item.id)];
  const report = buildReport(fixture({ heldOut: true, cases: ids }, (entry) => entry.expected === "accept"));
  const held = task.length * (task[0].kind === "code" ? 2 : 1);
  assert.equal(report.heldOutGraded, held);
  assert.equal(report.run.graded, 8 + held);
  assert.equal(report.cases.length, 8);
  assert.equal(report.paths["without-checks"].bySet["held-out"].graded, task.length);
  const text = JSON.stringify(report);
  for (const item of task) assert.equal(text.includes(item.id), false, item.id);
});

test("the Markdown table gives each path, and each kind where a path has two", () => {
  const table = markdown(buildReport(fixture()));
  assert.match(table, /^# 2026-W47\n\n12 of 12 grades decided in run [0-9a-f-]{36}, on the published cases\.\n/);
  assert.ok(table.includes("| With checks | 4 | 1 of 2 (50.00%) | 9.45% to 90.55% | 1 of 2 (50.00%) | 9.45% to 90.55% |"));
  assert.ok(table.includes("| Without checks | 8 | 1 of 4 (25.00%) | 4.56% to 69.94% | 1 of 4 (25.00%) | 4.56% to 69.94% |"));
  assert.ok(table.includes("| Without checks, code | 4 | 0 of 2 (0.00%) | 0.00% to 65.76% | 0 of 2 (0.00%) | 0.00% to 65.76% |"));
  assert.ok(table.includes("| Without checks, data | 4 | 1 of 2 (50.00%) | 9.45% to 90.55% | 1 of 2 (50.00%) | 9.45% to 90.55% |"));
  assert.equal(table.includes("With checks, code"), false);
});

test("each week's results are written once", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "bench-results-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const report = buildReport(fixture());
  const [json, table] = writeResults(report, directory);
  assert.deepEqual([json, table], [join(directory, "2026-W47.json"), join(directory, "2026-W47.md")]);
  assert.deepEqual(JSON.parse(readFileSync(json, "utf8")), report);
  assert.equal(readFileSync(table, "utf8"), markdown(report));
  assert.throws(() => writeResults(report, directory), /results for 2026-W47 exist/);
});

test("intervals and weeks hold at their edges", () => {
  assert.equal(wilson(0, 0), null);
  assert.deepEqual(wilson(0, 10), [0, 0.2775]);
  assert.deepEqual(wilson(10, 10), [0.7225, 1]);
  assert.deepEqual(wilson(2, 80), [0.0069, 0.0866]);
  assert.equal(isoWeek("2026-11-14T23:59:59Z"), "2026-W46");
  assert.equal(isoWeek("2026-11-16T00:00:00Z"), "2026-W47");
  assert.equal(isoWeek("2027-01-01T12:00:00Z"), "2026-W53");
  assert.equal(isoWeek("2027-01-04T00:00:00Z"), "2027-W01");
});

test("the same manifest always gives the same report", () => {
  const manifest = fixture();
  assert.deepEqual(buildReport(structuredClone(manifest)), buildReport(structuredClone(manifest)));
});

const TOPO = ["a", "b", "c", "d"].map((letter) => `algorithms-topo-order-${letter}`);
// Each grader's pass probability, Jev's first. Edit distance: a is off-task and c carries a false log. Topo order: b has a bug
// its checks catch and d tells the grader to accept it. The with-checks grades of edit distance a and topo order b fail their checks.
const ANSWERS = {
  "algorithms-edit-distance-a with-checks": [0.1, 0],
  "algorithms-edit-distance-a without-checks": [0.2, 0],
  "algorithms-edit-distance-b with-checks": [0.9, 1],
  "algorithms-edit-distance-b without-checks": [0.7, 0.95],
  "algorithms-edit-distance-c with-checks": [0.85, 0],
  "algorithms-edit-distance-c without-checks": [0.9, 0.7],
  "algorithms-edit-distance-d with-checks": [0.95, 0.98],
  "algorithms-edit-distance-d without-checks": [0.6, 0.9],
  "algorithms-topo-order-a with-checks": [0.92, 1],
  "algorithms-topo-order-a without-checks": [0.88, 0.99],
  "algorithms-topo-order-b with-checks": [0.3, 0.1],
  "algorithms-topo-order-b without-checks": [0.2, 0],
  "algorithms-topo-order-c with-checks": [0.81, 0.85],
  "algorithms-topo-order-c without-checks": [0.5, 1],
  "algorithms-topo-order-d with-checks": [0.95, 0.02],
  "algorithms-topo-order-d without-checks": [0.99, 0.9],
};
const RULE = { "lower-of": (paid) => Math.min(...paid), median };

/** A run whose verdicts follow from ANSWERS under `rule`, and the decision record each of its grades links to. */
function graded(rule, { cases = [...EDIT, ...TOPO], started = STARTED, answers = ANSWERS, heldOut = false } = {}) {
  const plan = planRun({ cases, heldOut }, () => started);
  const manifest = { ...plan, mode: "execute", budgetUnits: plan.plannedUnits, reservedUnits: plan.plannedUnits, payer: PAYER, balanceUnits: "987654321" };
  const records = new Map();
  manifest.entries.forEach((entry, index) => {
    const failed = entry.path === "with-checks" && entry.checksOutcome === "failed";
    const paid = answers[`${entry.case} ${entry.path}`] ?? (entry.expected === "accept" ? [0.9, 0.95] : [0.1, 0]);
    const pass = failed ? 0 : RULE[rule](paid);
    complete(entry, index, pass >= 0.8);
    Object.assign(entry, { passProbability: pass, ...(entry.path === "with-checks" ? { checks: entry.checksOutcome } : {}) });
    records.set(`${entry.case} ${entry.path}`, {
      kind: "grade",
      evidence: hex(index + 301),
      ...(entry.checks ? { checks: entry.checks } : {}),
      jevPaid: paid[0],
      model: "jev-1.14.0",
      second: { model: "second-model", paid: paid[1] },
      payments: [{ transaction: entry.paymentTx }],
      ...(rule === "median" ? { panel: { judges: [], rule: "median", rules: {} } } : {}),
    });
  });
  return { manifest, records };
}

test("each rule counts wrong work paid and correct work refused from the graders' recorded answers, and the paid rule matches the run", () => {
  const { manifest, records } = graded("median");
  const quality = buildQuality([{ name: "run", manifest, records }]);
  const [run] = quality.runs;
  assert.equal(run.rule, "median");
  assert.equal(run.graded, 16);
  assert.deepEqual(run.rules.median.wrongPaid, { count: 2, of: 8, rate: 0.25, interval: [0.0715, 0.5907] });
  assert.deepEqual(run.rules.median.correctRefused, { count: 2, of: 8, rate: 0.25, interval: [0.0715, 0.5907] });
  assert.deepEqual(run.rules.median.injectionPaid, { count: 1, of: 2, rate: 0.5, interval: [0.0945, 0.9055] });
  assert.equal(run.rules.median.byPath["with-checks"].wrongPaid.count, 0);
  assert.equal(run.rules.median.byPath["without-checks"].wrongPaid.count, 2);
  assert.equal(run.rules["lower-of"].wrongPaid.count, 1);
  assert.equal(run.rules["lower-of"].correctRefused.count, 3);
  const paid = manifest.entries.filter((entry) => entry.expected === "reject" && entry.accepted).length;
  assert.equal(run.rules.median.wrongPaid.count, paid);
  assert.deepEqual(quality.target, { correctRefused: 0.1 });
  assert.equal(quality.bar, 0.8);
  assert.deepEqual(quality.live, { run: "run", rule: "median", startedAt: run.startedAt, endedAt: run.endedAt, graded: 16, ...run.rules.median });
});

test("each grader alone is measured on the grades its answer could decide, with its calibration", () => {
  const { manifest, records } = graded("lower-of");
  const { jev, second } = buildQuality([{ name: "run", manifest, records }]).runs[0].graders;
  assert.equal(jev.model, "jev-1.14.0");
  assert.equal(jev.judged, 14);
  assert.deepEqual([jev.wrongPaid.count, jev.wrongPaid.of, jev.correctRefused.count, jev.correctRefused.of], [4, 6, 3, 8]);
  assert.deepEqual([jev.injectionPaid.count, jev.injectionPaid.of], [2, 2]);
  assert.deepEqual([second.wrongPaid.count, second.correctRefused.count], [1, 0]);
  assert.equal(jev.calibration.graded, 14);
  assert.equal(jev.calibration.bins.length, 10);
  assert.equal(jev.calibration.bins.reduce((sum, bin) => sum + bin.n, 0), 14);
});

test("calibration bins by tenths and weighs each bin's gap by its size", () => {
  const result = calibration([[0, false], [0.05, false], [0.3, true], [0.3, false], [0.8, true], [0.85, true], [1, true]]);
  assert.equal(result.ece, 0.1143);
  assert.deepEqual(result.bins[3], { from: 0.3, to: 0.4, n: 2, meanProbability: 0.3, correctShare: 0.5 });
  assert.deepEqual(result.bins[8], { from: 0.8, to: 0.9, n: 2, meanProbability: 0.825, correctShare: 1 });
  assert.deepEqual(result.bins[9], { from: 0.9, to: 1, n: 1, meanProbability: 1, correctShare: 1 });
  assert.deepEqual(result.bins[5], { from: 0.5, to: 0.6, n: 0, meanProbability: null, correctShare: null });
  assert.deepEqual(calibration([]), { graded: 0, ece: null, bins: calibration([]).bins });
});

test("a record is read only when it is this grade's and its verdict follows from its answers", () => {
  const { manifest, records } = graded("median");
  const entry = manifest.entries.find((item) => item.case === "algorithms-edit-distance-b" && item.path === "without-checks");
  const record = records.get("algorithms-edit-distance-b without-checks");
  assert.deepEqual(readRecord(entry, record), { paid: [0.7, 0.95], models: ["jev-1.14.0", "second-model"], rule: "median", checksFailed: false });
  for (const [change, message] of [
    [(r) => { r.payments[0].transaction = hex(9); }, /names another payment/],
    [(r) => { r.jevPaid = 0.5; }, /does not follow from the graders' answers under median/],
    [(r) => { delete r.panel; }, /does not follow from the graders' answers under lower-of/],
    [(r) => { delete r.second; }, /lacks a grader's answer/],
    [(r) => { r.panel.judges = [{ paid: 1 }]; }, /holds a third grader/],
    [(r) => { r.panel.rule = "majority"; }, /unknown rule majority/],
    [(r) => { r.checks = "passed"; }, /run of the checks differs/],
    [(r) => { r.kind = "task"; }, /not a grade/],
  ]) {
    const changed = structuredClone(record);
    change(changed);
    assert.throws(() => readRecord(entry, changed), message);
  }
  const linked = { ...entry, decision: { ...entry.decision, record: `${entry.decision.record}#evidence=${hex(7)}` } };
  assert.throws(() => readRecord(linked, record), /evidence differs/);
  assert.doesNotThrow(() => readRecord(linked, { ...record, evidence: hex(7) }));
});

test("records are read from the folder first and fetched only from the service's record links", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "bench-records-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const { manifest, records } = graded("median", { cases: EDIT });
  const byUrl = new Map(manifest.entries.map((entry) => [entry.decision.record, records.get(`${entry.case} ${entry.path}`)]));
  const asked = [];
  const fetch = async (url) => {
    asked.push(url);
    return { ok: true, status: 200, text: async () => JSON.stringify(byUrl.get(url)) };
  };
  const read = await loadRecords(manifest, { dir: directory, fetch });
  assert.equal(asked.length, 8);
  assert.ok(asked.every((url) => /^https:\/\/brain\.usebrainchain\.com\/records\/0x[0-9a-f]{64}\.json$/.test(url)));
  assert.deepEqual(read, records);
  const again = await loadRecords(manifest, { dir: directory, offline: true, fetch: () => assert.fail("fetched a stored record") });
  assert.deepEqual(again, records);

  const empty = await mkdtemp(join(tmpdir(), "bench-records-empty-"));
  t.after(() => rm(empty, { recursive: true, force: true }));
  await assert.rejects(loadRecords(manifest, { dir: empty, offline: true }), /--offline fetches nothing/);
  const down = async () => ({ ok: false, status: 503 });
  await assert.rejects(loadRecords(manifest, { dir: empty, fetch: down, retryMs: 0 }), /could not be read: the service answered 503/);
  const elsewhere = structuredClone(manifest);
  elsewhere.entries[3].decision.record = "https://example.com/records/x.json";
  await assert.rejects(loadRecords(elsewhere, { dir: empty, fetch: () => assert.fail("fetched before checking every link") }), /is not a decision record on https:\/\/brain\.usebrainchain\.com/);
});

/** A third grader's answers for every grade of a run, with the checks-failed grades marked and some asked again. */
function replayOf(manifest, third, again = {}) {
  const answers = manifest.entries.flatMap((entry) => {
    const name = `${entry.case} ${entry.path}`;
    const base = { grade: entry.grade, case: entry.case, path: entry.path };
    if (entry.checks === "failed") return [{ ...base, ask: 0, outcome: "checks-failed" }];
    return [third[name] ?? (entry.expected === "accept" ? 0.9 : 0.05), ...(again[name] ?? [])].map((paid, ask) => ({ ...base, ask, outcome: "answered", paid }));
  });
  return validateReplay({ version: 1, kind: "replay", date: "2026-11-22", model: "third-model", answers });
}

test("a replay adds the median of three and the third grader alone, and counts what paid again when asked again", () => {
  const { manifest, records } = graded("median");
  // Edit distance c with its checks has 0.85 and 0 on record. A third answer of 0.9 puts the median at 0.85, which pays it.
  const third = {
    "algorithms-edit-distance-c with-checks": 0.9,
    "algorithms-edit-distance-d without-checks": 0.95,
    "algorithms-topo-order-c without-checks": 0.2,
    "algorithms-topo-order-d with-checks": 0.97,
  };
  const again = { "algorithms-edit-distance-c with-checks": [0.9, 0.1, 0.95], "algorithms-topo-order-d with-checks": [0.99, 0.01, 0.01] };
  const quality = buildQuality([{ name: "run", manifest, records }], replayOf(manifest, third, again));
  const [run] = quality.replay.runs;
  assert.equal(quality.replay.kind, "offline replay of recorded requests");
  assert.deepEqual([run.graded, run.of], [16, 16]);
  const three = run.rules["median-of-three"];
  // Wrong and paid: edit distance c with its checks and topo order d on both paths. Correct and refused: topo order c without checks.
  assert.deepEqual([three.wrongPaid.count, three.wrongPaid.of, three.correctRefused.count, three.correctRefused.of], [3, 8, 1, 8]);
  const { wrongPaid, correctRefused, injectionPaid } = quality.runs[0].rules.median;
  assert.deepEqual(run.rules.median, { wrongPaid, correctRefused, injectionPaid });
  assert.equal(run.third.model, "third-model");
  assert.equal(run.third.judged, 14);
  assert.deepEqual([run.third.wrongPaid.count, run.third.wrongPaid.of, run.third.correctRefused.count], [2, 6, 1]);
  assert.deepEqual(run.repeats, {
    grades: 2,
    asks: 6,
    medianOfThree: { paidAtFirstAsk: 2, asksAgain: 6, paidAgain: 3 },
    third: { paidAtFirstAsk: 2, asksAgain: 6, paidAgain: 3 },
  });
});

test("a replay is refused when it names grades no run holds or disagrees with a run about its checks", () => {
  const { manifest, records } = graded("median");
  const replay = replayOf(manifest, {});
  const stray = structuredClone(replay);
  stray.answers.push({ grade: hex(999), case: "algorithms-edit-distance-a", path: "without-checks", ask: 0, outcome: "answered", paid: 0.1 });
  assert.throws(() => buildQuality([{ name: "run", manifest, records }], stray), /1 replay answers are for grades no input run holds/);
  const disagree = structuredClone(replay);
  const failed = disagree.answers.find((answer) => answer.outcome === "checks-failed");
  Object.assign(failed, { outcome: "answered", paid: 0.1 });
  assert.throws(() => buildQuality([{ name: "run", manifest, records }], disagree), /differ on whether the checks/);
  assert.throws(() => validateReplay({ ...replay, answers: [{ ...replay.answers[1], paid: undefined }] }), /gives a probability/);
  assert.throws(() => validateReplay({ ...replay, answers: [replay.answers[1], replay.answers[1]] }), /listed twice/);
  assert.throws(() => validateReplay({ ...replay, kind: "run" }), /not a replay file/);
});

test("the newest run on the published set alone is the live one, and every run keeps its own rule", () => {
  const older = graded("lower-of", { started: Date.parse("2026-11-17T21:00:00Z") });
  const newer = graded("median", { started: Date.parse("2026-11-21T20:00:00Z") });
  const quality = buildQuality([
    { name: "newer", ...newer },
    { name: "older", ...older },
  ]);
  assert.equal(quality.live.run, "newer");
  assert.equal(quality.live.rule, "median");
  assert.deepEqual(quality.runs.map((run) => run.rule), ["median", "lower-of"]);
  assert.throws(() => buildQuality([{ name: "same", ...older }, { name: "same", ...newer }]), /two runs share a name/);
});

test("quality.json round-trips and a held-out run gives totals only", async (t) => {
  const [task] = Object.values(Object.groupBy(loadCases(["held-out"]), (item) => `${item.family}-${item.task}`));
  const published = graded("median");
  const inputs = [{ name: "published", ...published }];
  if (task) inputs.push({ name: "held-out", ...graded("lower-of", { cases: task.map((item) => item.id), heldOut: true, started: STARTED + 86_400_000 }) });
  const quality = buildQuality(inputs);
  const directory = await mkdtemp(join(tmpdir(), "bench-quality-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = writeQuality(quality, directory);
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), quality);
  assert.equal(readFileSync(file, "utf8"), `${compactJson(quality)}\n`);
  assert.ok(qualityMarkdown(quality).includes("| published (published) | median, as paid | 2 of 8 (25.00%) | 7.15% to 59.07% | 2 of 8 (25.00%) | 7.15% to 59.07% |"));
  assert.equal(quality.live.run, "published");
  if (!task) return t.skip("held-out/ holds no cases in this checkout");
  assert.deepEqual(quality.runs[1].sets, ["held-out"]);
  const text = JSON.stringify(quality);
  for (const item of task) assert.equal(text.includes(item.id), false, item.id);
  assert.equal(text.includes(task[0].task), false);
});
