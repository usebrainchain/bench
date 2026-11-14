import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadCases } from "./lib/cases.mjs";
import { buildReport, isoWeek, markdown, validateManifest, wilson, writeResults } from "./report.mjs";
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
