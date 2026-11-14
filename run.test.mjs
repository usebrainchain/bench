import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { taskDirs } from "./lib/cases.mjs";
import { ENDPOINT, presetFor, statusUrl } from "./lib/service.mjs";
import { accountFromFile, guardTypedData, optionsFrom, planRun, runBench, safeError, validateOffer } from "./run.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ADDRESS = `0x${"12".repeat(20)}`;
const SIGNATURE = `0x${"34".repeat(64)}1b`;
const TX = `0x${"56".repeat(32)}`;
const RECORD = `0x${"78".repeat(32)}`;
const CODE = "algorithms-edit-distance-b";
const DATA = "invoices-catering-a";
const PRICE = 10_000;

function offerFor(change) {
  const robinhood = presetFor("robinhood");
  const base = presetFor("base");
  const accept = (lane, extra) => ({ scheme: "exact", network: lane.network, amount: String(PRICE), asset: lane.asset, payTo: lane.payTo, maxTimeoutSeconds: 300, extra });
  const offer = {
    x402Version: 2,
    error: "Payment required",
    resource: { url: ENDPOINT, description: "Jev grades a result against your brief", mimeType: "application/json" },
    accepts: [accept(robinhood, { assetTransferMethod: "permit2" }), accept(robinhood, robinhood.domain), accept(base, base.domain)],
  };
  change?.(offer);
  return offer;
}

const offerResponse = (offer) => Response.json(offer, { status: 402, headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(offer)).toString("base64") } });

async function harness(t, configuration = {}) {
  const directory = await mkdtemp(join(tmpdir(), "bench-run-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const output = join(directory, "run.json");
  const options = { mode: "execute", budgetUsd: "0.03", cases: [CODE, DATA], waitSeconds: 0, output, ...configuration.options };
  const preset = presetFor(options.payOn);
  const counts = { accounts: 0, funds: 0, signatures: 0, posts: 0, polls: 0, quotes: 0 };
  const typed = [];
  const saved = () => JSON.parse(readFileSync(output, "utf8"));
  const view = (grade, state = "graded", verdict = {}) => {
    const base = { grade, state, status: statusUrl(grade), network: preset.network, paymentTx: TX };
    if (state !== "graded") return base;
    const decision = { id: "4812", record: `https://brain.usebrainchain.com/records/${RECORD}.json`, page: "https://usebrainchain.com/decision?id=4812" };
    return { ...base, accepted: true, answer: "accept", passProbability: 0.92, bar: 0.8, confidence: 0.92, decision, ...verdict };
  };
  const deps = {
    sleep: async () => {},
    async getAccount() {
      counts.accounts += 1;
      return {
        address: ADDRESS,
        async signTypedData(data) {
          counts.signatures += 1;
          typed.push(data);
          const manifest = saved();
          assert.equal(manifest.entries.filter((entry) => entry.phase === "signing").length, 1, "the payment is recorded before it is signed");
          assert.equal(manifest.reservedUnits, String(PRICE * counts.signatures), "the reservation is durable before it is signed");
          return configuration.sign?.(data) ?? SIGNATURE;
        },
      };
    },
    async readFunds() {
      counts.funds += 1;
      return configuration.balance ?? 10_000_000n;
    },
    async fetchImpl(url, init) {
      assert.equal(init.redirect, "error");
      if (init.method === "GET" && url === ENDPOINT) {
        counts.quotes += 1;
        return configuration.offer?.() ?? offerResponse(offerFor());
      }
      const manifest = saved();
      if (init.method === "POST") {
        counts.posts += 1;
        const entry = manifest.entries.find((item) => item.phase === "submitted");
        assert.equal(url, ENDPOINT);
        assert.ok(init.headers["PAYMENT-SIGNATURE"].length > 0);
        assert.equal(createHash("sha256").update(init.body).digest("hex"), entry.payloadHash, "the body is the case's request");
        return configuration.post?.(entry, view) ?? Response.json(view(entry.grade));
      }
      counts.polls += 1;
      assert.equal(init.method, "GET");
      const entry = manifest.entries.find((item) => item.grade && statusUrl(item.grade) === url);
      assert.ok(entry, `read a grade the manifest does not hold: ${url}`);
      return configuration.poll?.(entry, view) ?? Response.json(view(entry.grade));
    },
  };
  return { options, preset, deps, output, counts, typed, saved, configuration };
}

const phases = (manifest) => manifest.entries.map((entry) => entry.phase);
const nothingPaid = (counts) => ({ accounts: counts.accounts, signatures: counts.signatures, posts: counts.posts });

test("a dry run reads no key, sends nothing and prices the published set at the partner price", () => {
  const plan = planRun();
  assert.deepEqual(plan.sets, ["published"]);
  assert.equal(plan.entries.length, 360);
  assert.equal(plan.entries.filter((entry) => entry.path === "with-checks").length, 160);
  assert.equal(plan.plannedUnits, "3600000");
  assert.ok(plan.entries.every((entry) => entry.set === "published" && entry.phase === "planned" && !("request" in entry)));
  const text = execFileSync(process.execPath, ["run.mjs", "--dry", "--case", CODE], { cwd: HERE, env: { PATH: process.env.PATH }, encoding: "utf8" });
  assert.match(text, /2 grades of 1 case \(published\) at 0\.01 USDG each: 0\.02 USDG/);
  assert.match(text, /\/x402\/grades\/for\/bench in USDG on Robinhood Chain by EIP-3009/);
  assert.match(text, /no key was read and nothing was signed or sent/);
});

test("held-out cases join a run only with --held-out", () => {
  if (taskDirs("held-out").length === 0) return assert.throws(() => planRun({ heldOut: true }), /held-out\/ holds no cases/);
  const plan = planRun({ heldOut: true });
  assert.deepEqual(plan.sets, ["published", "held-out"]);
  assert.equal(plan.entries.length, 540);
  assert.equal(plan.entries.filter((entry) => entry.set === "held-out").length, 180);
});

test("paying needs a budget that covers the run", async (t) => {
  const h = await harness(t);
  await assert.rejects(runBench({ ...h.options, budgetUsd: undefined }, h.deps), /--budget-usd/);
  await assert.rejects(runBench({ ...h.options, budgetUsd: "0.02" }, h.deps), /below the run's 0\.03/);
  assert.deepEqual(Object.values(h.counts), [0, 0, 0, 0, 0, 0]);
  assert.throws(() => optionsFrom(["--execute", "--output", "run.json"]), /--budget-usd/);
  assert.throws(() => optionsFrom(["--continue", "--output", "run.json", "--budget-usd", "9"]), /fixes the selection, the lane and the budget/);
  assert.throws(() => optionsFrom(["--resume", "--output", "run.json", "--held-out"]), /fixes the selection/);
  assert.throws(() => optionsFrom(["--dry", "--execute"]), /choose one/);
  assert.throws(() => optionsFrom(["--resume", "--output", "run.json", "--wait-seconds", "901"]), /0 to 900/);
});

for (const payOn of ["robinhood", "base"]) {
  test(`${payOn}: the x402 SDK signs one guarded EIP-3009 transfer per grade`, async (t) => {
    const h = await harness(t, { options: { payOn } });
    const manifest = await runBench(h.options, h.deps);
    assert.deepEqual(phases(manifest), ["completed", "completed", "completed"], JSON.stringify(manifest.entries[0]));
    assert.deepEqual(h.counts, { accounts: 1, funds: 1, signatures: 3, posts: 3, polls: 0, quotes: 3 });
    assert.equal(manifest.reservedUnits, "30000");
    assert.equal(manifest.payer, ADDRESS);
    assert.deepEqual(manifest.entries[0].decision, { id: "4812", page: "https://usebrainchain.com/decision?id=4812", record: `https://brain.usebrainchain.com/records/${RECORD}.json` });
    const text = readFileSync(h.output, "utf8");
    assert.equal(text.includes(SIGNATURE.slice(2)), false);
    assert.equal(text.includes("PAYMENT-SIGNATURE"), false);
    const [data] = h.typed;
    assert.equal(data.primaryType, "TransferWithAuthorization");
    assert.deepEqual(data.domain, { ...h.preset.domain, chainId: h.preset.chainId, verifyingContract: h.preset.asset });
    assert.equal(data.message.value, 10_000n);
    const accept = validateOffer(offerFor(), h.preset);
    assert.doesNotThrow(() => guardTypedData(data, h.preset, ADDRESS, accept));
    for (const mutate of [
      (copy) => { copy.primaryType = "PermitWitnessTransferFrom"; },
      (copy) => { copy.domain.chainId += 1; },
      (copy) => { copy.domain.name = "Other Dollar"; },
      (copy) => { copy.domain.verifyingContract = ADDRESS; },
      (copy) => { copy.domain.salt = RECORD; },
      (copy) => { copy.types.TransferWithAuthorization[2].type = "uint128"; },
      (copy) => { copy.message.value = 250_000n; },
      (copy) => { copy.message.to = ADDRESS; },
      (copy) => { copy.message.from = h.preset.payTo; },
      (copy) => { copy.message.validAfter = 1n; },
      (copy) => { copy.message.validBefore = 2n ** 255n; },
      (copy) => { copy.message.nonce = "0x01"; },
    ]) {
      const copy = structuredClone(data);
      mutate(copy);
      assert.throws(() => guardTypedData(copy, h.preset, ADDRESS, accept));
    }
  });
}

test("a missing bench route stops the run before a key is read", async (t) => {
  const h = await harness(t, { offer: () => Response.json({ error: "No such route." }, { status: 404 }) });
  const manifest = await runBench(h.options, h.deps);
  assert.deepEqual(phases(manifest), ["blocked_before_payment", "planned", "planned"]);
  assert.match(manifest.entries[0].error, /lists no bench price, and this runner never pays the public one/);
  assert.match(manifest.stopped.reason, /ended blocked before payment/);
  assert.equal(manifest.reservedUnits, "0");
  assert.deepEqual(nothingPaid(h.counts), { accounts: 0, signatures: 0, posts: 0 });
});

test("an offer at the public price, or on other terms, is refused", async (t) => {
  const h = await harness(t, { offer: () => offerResponse(offerFor((offer) => offer.accepts.forEach((accept) => (accept.amount = "250000")))) });
  const manifest = await runBench(h.options, h.deps);
  assert.equal(manifest.entries[0].phase, "blocked_before_payment");
  assert.match(manifest.entries[0].error, /asks 0\.25, not the bench price of 0\.01; nothing was paid/);
  assert.deepEqual(nothingPaid(h.counts), { accounts: 0, signatures: 0, posts: 0 });
  const eip3009 = (offer) => offer.accepts[1];
  for (const mutate of [
    (offer) => { offer.x402Version = 1; },
    (offer) => { offer.resource.url = "https://brain.usebrainchain.com/x402/grades"; },
    (offer) => { eip3009(offer).amount = "250000"; },
    (offer) => { eip3009(offer).payTo = ADDRESS; },
    (offer) => { eip3009(offer).asset = ADDRESS; },
    (offer) => { eip3009(offer).network = "eip155:1"; },
    (offer) => { eip3009(offer).maxTimeoutSeconds = 601; },
    (offer) => { eip3009(offer).extra.name = "USDG"; },
    (offer) => { eip3009(offer).extra = { ...eip3009(offer).extra, assetTransferMethod: "eip3009" }; },
    (offer) => { offer.accepts.splice(1, 1); },
    (offer) => { offer.accepts.push(structuredClone(eip3009(offer))); },
  ]) {
    assert.throws(() => validateOffer(offerFor(mutate), presetFor("robinhood")));
  }
});

test("a payer short of the run's cost signs nothing", async (t) => {
  const h = await harness(t, { balance: 29_999n });
  const manifest = await runBench(h.options, h.deps);
  assert.equal(manifest.entries[0].phase, "blocked_before_payment");
  assert.match(manifest.entries[0].error, /holds 0\.03 USDG, below the 0\.03/);
  assert.deepEqual(nothingPaid(h.counts), { accounts: 1, signatures: 0, posts: 0 });
});

test("an unanswered payment is never paid again: resume only reads it, continue pays only unsigned grades", async (t) => {
  const h = await harness(t, {
    post: () => {
      throw new Error(`socket closed after ${SIGNATURE}`);
    },
    poll: () => new Response(null, { status: 404 }),
  });
  const first = await runBench(h.options, h.deps);
  assert.deepEqual(phases(first), ["manual_reconciliation", "planned", "planned"]);
  assert.match(first.entries[0].grade, /^0x[0-9a-f]{64}$/);
  assert.equal(first.entries[0].error, "socket closed after 0x…");
  assert.equal(first.reservedUnits, "10000");
  await assert.rejects(runBench(h.options, h.deps), /exists: --resume reads its grades/);
  await assert.rejects(runBench({ mode: "continue", output: h.output, waitSeconds: 0 }, h.deps), /may have been paid without a verdict, so nothing more is paid/);
  assert.equal(h.counts.signatures, 1);

  const resumed = await runBench({ mode: "resume", output: h.output, waitSeconds: 0 }, {
    getAccount: () => assert.fail("resume read a key"),
    readFunds: () => assert.fail("resume read funds"),
    async fetchImpl(url, init) {
      assert.equal(init.method, "GET");
      assert.equal(url, statusUrl(first.entries[0].grade));
      return Response.json(viewOf(h, first.entries[0].grade));
    },
  });
  assert.deepEqual(phases(resumed), ["completed", "planned", "planned"]);

  h.configuration.post = undefined;
  const continued = await runBench({ mode: "continue", output: h.output, waitSeconds: 0 }, h.deps);
  assert.deepEqual(phases(continued), ["completed", "completed", "completed"]);
  assert.equal(continued.entries[0].attemptedAt, first.entries[0].attemptedAt);
  assert.equal(h.counts.signatures, 3);
  assert.equal(continued.reservedUnits, "30000");
});

function viewOf(h, grade) {
  return {
    grade,
    state: "graded",
    status: statusUrl(grade),
    network: h.preset.network,
    accepted: false,
    answer: "reject",
    passProbability: 0,
    bar: 0.8,
    confidence: 1,
    checks: { language: "python", outcome: "failed" },
    decision: { id: "4813", record: `https://brain.usebrainchain.com/records/${RECORD}.json` },
  };
}

test("a failure while signing keeps its reservation and is never signed again", async (t) => {
  const h = await harness(t, {
    sign: () => {
      throw new Error("the wallet failed");
    },
  });
  const first = await runBench(h.options, h.deps);
  assert.deepEqual(phases(first), ["manual_reconciliation", "planned", "planned"]);
  assert.equal(first.entries[0].grade, undefined);
  assert.equal(first.reservedUnits, "10000");
  assert.equal(h.counts.posts, 0);
  const resumed = await runBench({ mode: "resume", output: h.output, waitSeconds: 0 }, h.deps);
  assert.equal(resumed.entries[0].phase, "manual_reconciliation");
  await assert.rejects(runBench({ mode: "continue", output: h.output, waitSeconds: 0 }, h.deps), /without a verdict/);
  assert.equal(h.counts.signatures, 1);
});

test("a payment recorded just before a crash needs a person before anything more is paid", async (t) => {
  const h = await harness(t, { offer: () => Response.json({}, { status: 404 }) });
  await runBench(h.options, h.deps);
  const manifest = h.saved();
  Object.assign(manifest.entries[1], { phase: "signing", attemptedAt: new Date().toISOString() });
  writeFileSync(h.output, JSON.stringify(manifest));
  const resumed = await runBench({ mode: "resume", output: h.output, waitSeconds: 0 }, h.deps);
  assert.equal(resumed.entries[1].phase, "manual_reconciliation");
  h.configuration.offer = undefined;
  await assert.rejects(runBench({ mode: "continue", output: h.output, waitSeconds: 0 }, h.deps), /1 grades may have been paid/);
  assert.deepEqual(nothingPaid(h.counts), { accounts: 0, signatures: 0, posts: 0 });
});

test("a payer the bench route does not list is refused without a charge, and the run stops", async (t) => {
  const error = "This route is for a named partner's wallets. Nothing was charged; pay at /x402/grades.";
  const h = await harness(t, { post: () => Response.json({ error }, { status: 403 }) });
  const manifest = await runBench(h.options, h.deps);
  assert.deepEqual(phases(manifest), ["payment_rejected", "planned", "planned"]);
  assert.equal(manifest.entries[0].error, `the service answered 403: ${error}`);
  assert.deepEqual(h.counts, { accounts: 1, funds: 1, signatures: 1, posts: 1, polls: 0, quotes: 1 });
});

test("slow grades do not stop a run until three are undecided", async (t) => {
  const cases = ["a", "b", "c", "d"].map((letter) => `algorithms-edit-distance-${letter}`);
  const h = await harness(t, {
    options: { cases, budgetUsd: "0.08" },
    post: (entry, view) => Response.json(view(entry.grade, "paid"), { status: 202 }),
    poll: (entry, view) => Response.json(view(entry.grade, "paid")),
  });
  const first = await runBench(h.options, h.deps);
  assert.deepEqual(phases(first), ["pending", "pending", "pending", "planned", "planned", "planned", "planned", "planned"]);
  assert.match(first.stopped.reason, /^3 paid grades are still undecided/);
  assert.equal(h.counts.signatures, 3);
  h.configuration.post = undefined;
  h.configuration.poll = undefined;
  const continued = await runBench({ mode: "continue", output: h.output, waitSeconds: 0 }, h.deps);
  assert.ok(phases(continued).every((phase) => phase === "completed"));
  assert.equal(continued.stopped, undefined);
  assert.equal(h.counts.signatures, 8);
});

test("a reply for another grade or pointing elsewhere is not trusted, and only the paid grade is read", async (t) => {
  const other = `0x${"ab".repeat(32)}`;
  const h = await harness(t, {
    post: (_entry, view) => Response.json(view(other)),
    poll: () => new Response(null, { status: 404 }),
  });
  const manifest = await runBench(h.options, h.deps);
  assert.equal(manifest.entries[0].phase, "manual_reconciliation");
  assert.equal(manifest.entries[0].error, "the service answered for another grade than the one paid for");
  assert.equal(h.counts.polls, 1);

  const elsewhere = await harness(t, {
    post: (entry, view) => Response.json({ ...view(entry.grade), status: "https://example.invalid/steal" }),
  });
  const read = await runBench(elsewhere.options, elsewhere.deps);
  assert.deepEqual(phases(read), ["completed", "completed", "completed"]);
  assert.equal(read.entries[0].error, "the service's reply points elsewhere for its status");
  assert.equal(elsewhere.counts.polls, 3);
  for (const change of [
    (raw) => { raw.decision.record = "https://example.invalid/records/x.json"; },
    (raw) => { raw.accepted = false; },
    (raw) => { raw.passProbability = 1.5; },
    (raw) => { raw.network = "eip155:1"; },
  ]) {
    const changed = await harness(t, {
      post: (entry, view) => {
        const raw = view(entry.grade);
        change(raw);
        return Response.json(raw);
      },
      poll: () => new Response(null, { status: 404 }),
    });
    const result = await runBench(changed.options, changed.deps);
    assert.equal(result.entries[0].phase, "manual_reconciliation");
  }
});

test("a run never reserves past its budget, and pays no case that changed since it was planned", async (t) => {
  const h = await harness(t, { offer: () => Response.json({}, { status: 404 }) });
  await runBench(h.options, h.deps);
  const manifest = h.saved();
  manifest.budgetUnits = "10000";
  writeFileSync(h.output, JSON.stringify(manifest));
  h.configuration.offer = undefined;
  const continued = await runBench({ mode: "continue", output: h.output, waitSeconds: 0 }, h.deps);
  assert.deepEqual(phases(continued), ["completed", "blocked_before_payment", "planned"]);
  assert.match(continued.entries[1].error, /would pass the budget of 0\.01/);
  assert.equal(continued.reservedUnits, "10000");
  assert.equal(h.counts.signatures, 1);

  const changed = h.saved();
  changed.budgetUnits = "30000";
  changed.entries[1].payloadHash = "0".repeat(64);
  writeFileSync(h.output, JSON.stringify(changed));
  const refused = await runBench({ mode: "continue", output: h.output, waitSeconds: 0 }, h.deps);
  assert.match(refused.entries[1].error, /changed since the run was planned/);
  assert.equal(h.counts.signatures, 1);
});

test("a manifest in use cannot be opened by a second runner", async (t) => {
  const h = await harness(t);
  writeFileSync(`${h.output}.lock`, "");
  await assert.rejects(runBench(h.options, h.deps), /\.lock exists/);
  assert.deepEqual(Object.values(h.counts), [0, 0, 0, 0, 0, 0]);
});

test("the payer's key comes only from a private file", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "bench-key-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const key = generatePrivateKey();
  const file = join(directory, "bench.key");
  assert.throws(() => accountFromFile(undefined), /set BENCH_PAYER_KEY_FILE/);
  assert.throws(() => accountFromFile(file), /names no file/);
  writeFileSync(file, `${key}\n`, { mode: 0o644 });
  assert.throws(() => accountFromFile(file), (error) => /readable by other users/.test(error.message) && !error.message.includes(key.slice(2)));
  writeFileSync(join(directory, "bad.key"), "not a key", { mode: 0o600 });
  assert.throws(() => accountFromFile(join(directory, "bad.key")), /does not hold a 32-byte hex key/);
  writeFileSync(join(directory, "good.key"), `${key.slice(2)}\n`, { mode: 0o600 });
  assert.equal(accountFromFile(join(directory, "good.key")).address, privateKeyToAccount(key).address);
});

test("errors never carry a signature, a payment header or a local path", () => {
  const header = "A".repeat(200);
  const message = safeError(new Error(`failed at ${join(homedir(), "x")} with ${SIGNATURE} and ${header}\nsecond line`));
  assert.equal(message, `failed at ${join("~", "x")} with 0x… and …`);
});
