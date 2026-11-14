import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { ExactEvmScheme } from "@x402/evm/exact/client";
import { x402Client, x402HTTPClient } from "@x402/fetch";
import { createPublicClient, http, keccak256, parseAbi, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { ROOT, taskDirs } from "./lib/cases.mjs";
import { canonical, familyTable, selectEntries } from "./lib/requests.mjs";
import { decisionPage, PARTNER, presetFor, SERVICE, statusUrl, usd } from "./lib/service.mjs";

const USAGE = `node run.mjs --dry [--held-out] [--pay-on robinhood|base] [--path with-checks|without-checks] [--family NAME]... [--case ID]...
node run.mjs --execute --budget-usd 3.60 --output runs/NAME.json [the same selection]
node run.mjs --resume --output runs/NAME.json [--wait-seconds 180]
node run.mjs --continue --output runs/NAME.json [--wait-seconds 180]

--dry prints the run and reads no key. --execute pays for each grade through ${SERVICE}/x402/grades/for/${PARTNER}
and records it in the manifest before it signs. --resume reads the grades a manifest paid for and never signs.
--continue pays for the grades a stopped run never signed. Paying reads the key from the file BENCH_PAYER_KEY_FILE names.`;

const MAX_TIMEOUT_SECONDS = 600;
// The desk retries a paid grade until Jev decides it, so one slow grade is no reason to stop. Three undecided at once
// means the judge is down, and more payments would only queue behind them.
const MAX_UNDECIDED = 3;
const GRADE = /^0x[0-9a-f]{64}$/;
const HEX32 = /^0x[0-9a-f]{64}$/i;
const STATES = ["paying", "unconfirmed", "failed", "paid", "graded"];
const UNPAID = ["planned", "blocked_before_payment"];
const SETTLED = ["completed", "payment_failed", "payment_rejected"];
const NEEDS_A_PERSON = ["signing", "submitted", "manual_reconciliation"];
const TRANSFER_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};
const ERC20 = parseAbi(["function balanceOf(address) view returns (uint256)"]);

class RunError extends Error {}
const guard = (condition, message) => {
  if (!condition) throw new RunError(message);
};
const sameAddress = (a, b) => typeof a === "string" && /^0x[0-9a-f]{40}$/i.test(a) && a.toLowerCase() === b.toLowerCase();
const probability = (value) => Number.isFinite(value) && value >= 0 && value <= 1;
const timestamp = (now) => new Date(now()).toISOString();
const key = (entry) => `${entry.case} ${entry.path}`;
const readable = (entry) => entry.grade !== undefined && !SETTLED.includes(entry.phase);

// What an error says reaches the manifest and the terminal, so a payment header, a signature or a local path never does.
export const safeError = (error) =>
  String(error?.message ?? error)
    .split("\n")[0]
    .slice(0, 300)
    .replaceAll(homedir(), "~")
    .replace(/0x[0-9a-f]{64,}/gi, "0x…")
    .replace(/[A-Za-z0-9+/=]{120,}/g, "…");

function units(text) {
  guard(/^\d{1,6}(?:\.\d{1,6})?$/.test(text ?? ""), "--budget-usd is an amount such as 3.60");
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}

function commit() {
  const git = spawnSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" });
  return git.status === 0 ? git.stdout.trim() : null;
}

/** The run a selection makes, without the request texts: they are rebuilt from the case files and held to these hashes. */
export function planRun(options = {}, now = Date.now) {
  const preset = presetFor(options.payOn);
  const sets = options.heldOut ? ["published", "held-out"] : ["published"];
  guard(!options.heldOut || taskDirs("held-out").length > 0, "held-out/ holds no cases in this checkout");
  const { entries, problem } = selectEntries({ sets, families: options.families, cases: options.cases, path: options.path });
  guard(!problem, problem);
  return {
    version: 1,
    mode: "plan",
    runId: randomUUID(),
    createdAt: timestamp(now),
    commit: commit(),
    sets,
    preset,
    plannedUnits: (BigInt(preset.priceUnits) * BigInt(entries.length)).toString(),
    entries: entries.map(({ request, ...entry }) => ({ ...entry, phase: "planned" })),
  };
}

export function dryRun(options = {}) {
  const plan = planRun(options);
  const { preset } = plan;
  const cases = new Set(plan.entries.map((entry) => entry.case)).size;
  const lines = [
    familyTable(plan.entries),
    "",
    `${plan.entries.length} grade${plan.entries.length === 1 ? "" : "s"} of ${cases} case${cases === 1 ? "" : "s"} (${plan.sets.join(" and ")}) at ${usd(preset.priceUnits)} ${preset.token} each: ${usd(plan.plannedUnits)} ${preset.token}.`,
    `Each is paid through ${preset.endpoint} in ${preset.token} on ${preset.chain} by EIP-3009, to ${preset.payTo}.`,
  ];
  if (options.budgetUsd === undefined) lines.push(`--execute needs --budget-usd ${usd(plan.plannedUnits)} or more.`);
  else if (units(options.budgetUsd) >= BigInt(plan.plannedUnits)) lines.push(`The budget of ${usd(units(options.budgetUsd))} covers it.`);
  else lines.push(`The budget of ${usd(units(options.budgetUsd))} is below it, and --execute would refuse it.`);
  if (options.output && existsSync(resolve(options.output))) lines.push(`${options.output} exists, and --execute would refuse it.`);
  lines.push("Dry run: no key was read and nothing was signed or sent.");
  return lines.join("\n");
}

export function validateOffer(offer, preset) {
  guard(offer?.x402Version === 2 && Array.isArray(offer.accepts) && offer.accepts.length > 0, "the offer is not an x402 version 2 offer");
  guard(offer.resource?.url === preset.endpoint, `the offer is for ${String(offer.resource?.url).slice(0, 120)}, not ${preset.endpoint}`);
  const prices = [...new Set(offer.accepts.map((accept) => accept?.amount))];
  const asked = prices.map((price) => (/^\d{1,18}$/.test(price) ? usd(price) : "an unreadable amount")).join(" and ");
  guard(prices.length === 1 && prices[0] === preset.priceUnits, `the offer asks ${asked}, not the ${PARTNER} price of ${usd(preset.priceUnits)}; nothing was paid`);
  const matches = offer.accepts.filter(
    (accept) =>
      accept.scheme === "exact" &&
      accept.network === preset.network &&
      sameAddress(accept.asset, preset.asset) &&
      sameAddress(accept.payTo, preset.payTo) &&
      Number.isInteger(accept.maxTimeoutSeconds) &&
      accept.maxTimeoutSeconds > 0 &&
      accept.maxTimeoutSeconds <= MAX_TIMEOUT_SECONDS &&
      canonical(accept.extra) === canonical(preset.domain),
  );
  guard(matches.length === 1, `the offer has no single ${preset.token} payment by EIP-3009 to ${preset.payTo} on ${preset.chain}`);
  const { scheme, network, amount, asset, payTo, maxTimeoutSeconds, extra } = matches[0];
  return { scheme, network, amount, asset, payTo, maxTimeoutSeconds, extra: { name: extra.name, version: extra.version } };
}

export function guardTypedData(data, preset, payer, accept, now = Date.now) {
  const { domain, types, primaryType, message } = data ?? {};
  guard(primaryType === "TransferWithAuthorization" && canonical(types) === canonical(TRANSFER_TYPES), "the signature asked for is not a transfer authorization");
  const expected = { ...preset.domain, chainId: preset.chainId, verifyingContract: preset.asset.toLowerCase() };
  guard(canonical({ ...domain, verifyingContract: String(domain?.verifyingContract).toLowerCase() }) === canonical(expected), `the signature's domain is not ${preset.token} on ${preset.chain}`);
  guard(sameAddress(message?.from, payer) && sameAddress(message.to, preset.payTo) && message.value === BigInt(preset.priceUnits), "the transfer is not the partner price from the payer to the desk");
  const current = BigInt(Math.floor(now() / 1000));
  const window = message.validAfter === 0n && typeof message.validBefore === "bigint" && message.validBefore > current && message.validBefore <= current + BigInt(accept.maxTimeoutSeconds + 5);
  guard(window, "the transfer's validity window is not the offer's");
  guard(HEX32.test(message.nonce ?? ""), "the transfer's nonce is not 32 bytes");
}

async function fetchOffer(preset, deps) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await deps
      .fetchImpl(preset.endpoint, { method: "GET", redirect: "error", headers: { accept: "application/json" }, signal: AbortSignal.timeout(15_000) })
      .catch((error) => error);
    const transient = response instanceof Error || response.status >= 500;
    if (!transient || attempt === 3) {
      if (response instanceof Error) throw response;
      return response;
    }
    await response.body?.cancel();
    await deps.sleep(2000 * attempt);
  }
}

async function offered(preset, deps) {
  const response = await fetchOffer(preset, deps);
  const header = response.headers.get("payment-required");
  await response.body?.cancel();
  guard(response.status !== 404, `${preset.endpoint} answers 404: the service lists no ${PARTNER} price, and this runner never pays the public one`);
  guard(response.status === 402, `${preset.endpoint} answered ${response.status}, not its 402 offer`);
  guard(header && header.length <= 65_536 && /^[A-Za-z0-9+/]+={0,2}$/.test(header), "the offer carries no readable PAYMENT-REQUIRED header");
  return validateOffer(JSON.parse(Buffer.from(header, "base64").toString("utf8")), preset);
}

export function accountFromFile(file = process.env.BENCH_PAYER_KEY_FILE) {
  guard(file, "set BENCH_PAYER_KEY_FILE to the file that holds the payer's key");
  const stat = statSync(file, { throwIfNoEntry: false });
  guard(stat?.isFile(), "BENCH_PAYER_KEY_FILE names no file");
  guard((stat.mode & 0o077) === 0, "the key file is readable by other users; chmod 600 it");
  const secret = readFileSync(file, "utf8").trim();
  guard(/^(0x)?[0-9a-fA-F]{64}$/.test(secret), "the key file does not hold a 32-byte hex key");
  return privateKeyToAccount(secret.startsWith("0x") ? secret : `0x${secret}`);
}

async function readFunds(address, preset) {
  const client = createPublicClient({ transport: http(preset.rpc, { retryCount: 1, timeout: 15_000 }) });
  guard((await client.getChainId()) === preset.chainId, `${preset.rpc} is not ${preset.chain}`);
  return client.readContract({ address: preset.asset, abi: ERC20, functionName: "balanceOf", args: [address] });
}

async function payer(manifest, save, deps) {
  const account = await deps.getAccount();
  guard(!manifest.payer || sameAddress(account.address, manifest.payer), "the key file holds another wallet than the one this run paid from");
  const { priceUnits, token } = manifest.preset;
  const owed = BigInt(priceUnits) * BigInt(manifest.entries.filter((entry) => UNPAID.includes(entry.phase)).length);
  const balance = await deps.readFunds(account.address, manifest.preset);
  guard(typeof balance === "bigint" && balance >= owed, `the payer holds ${usd(balance)} ${token}, below the ${usd(owed)} the rest of the run costs`);
  manifest.payer = account.address;
  manifest.balanceUnits = balance.toString();
  await save();
  return account;
}

/** Signs one payment, once, after `beforeSign` has recorded it. */
async function signPayment(account, preset, accept, beforeSign) {
  let signed = false;
  const signer = {
    address: account.address,
    async signTypedData(data) {
      guard(!signed, "a second signature was asked for and refused");
      guardTypedData(data, preset, account.address, accept);
      await beforeSign();
      signed = true;
      return account.signTypedData(data);
    },
  };
  const client = x402Client.fromConfig({
    schemes: [{ network: preset.network, client: new ExactEvmScheme(signer) }],
    spendControls: { allowedAssets: [{ network: preset.network, asset: preset.asset, maxAmountPerPayment: preset.priceUnits }] },
    policies: [(_version, requirements) => requirements.filter((item) => canonical(item) === canonical(accept))],
  });
  // createPaymentPayload signs once; wrapFetchWithPayment can sign a second payment on its retry path.
  const payment = await client.createPaymentPayload({ x402Version: 2, resource: { url: preset.endpoint }, accepts: [accept] });
  guard(signed, "the payment was not signed by the guarded signer");
  return {
    grade: keccak256(toBytes(canonical(payment.payload))),
    header: new x402HTTPClient(client).encodePaymentSignatureHeader(payment)["PAYMENT-SIGNATURE"],
  };
}

async function jsonBody(response) {
  guard(response.body, "the service sent an empty reply");
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    guard(size <= 65_536, "the service's reply is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function gradeView(raw, preset) {
  guard(raw && typeof raw === "object" && HEX32.test(raw.grade ?? ""), "the service's reply names no grade");
  const grade = raw.grade.toLowerCase();
  guard(raw.status === statusUrl(grade), "the service's reply points elsewhere for its status");
  guard(STATES.includes(raw.state), "the service's reply has an unknown state");
  guard(raw.network === undefined || raw.network === preset.network, "the grade was paid on another network");
  guard(raw.paymentTx === undefined || HEX32.test(raw.paymentTx), "the payment transaction is malformed");
  const view = { grade, state: raw.state, ...(raw.paymentTx ? { paymentTx: raw.paymentTx.toLowerCase() } : {}) };
  if (raw.state !== "graded") return view;
  guard(typeof raw.accepted === "boolean" && ["accept", "reject"].includes(raw.answer), "the verdict has no answer");
  guard([raw.passProbability, raw.bar, raw.confidence].every(probability), "the verdict's probabilities are out of range");
  guard(raw.accepted === (raw.answer === "accept" && raw.passProbability >= raw.bar), "the verdict's acceptance contradicts its probability and bar");
  guard(typeof raw.decision?.id === "string" && /^\d{1,20}$/.test(raw.decision.id), "the verdict names no decision");
  guard(typeof raw.decision.record === "string" && raw.decision.record.length <= 2048 && URL.canParse(raw.decision.record), "the decision record is not a URL");
  const record = new URL(raw.decision.record);
  const onService = record.origin === SERVICE && /^\/records\/0x[0-9a-f]{64}\.json$/i.test(record.pathname) && !record.search && !record.hash && !record.username && !record.password;
  guard(onService, "the decision record is not on the service");
  return {
    ...view,
    accepted: raw.accepted,
    answer: raw.answer,
    passProbability: raw.passProbability,
    bar: raw.bar,
    confidence: raw.confidence,
    ...(["passed", "failed", "timed out"].includes(raw.checks?.outcome) ? { checks: raw.checks.outcome } : {}),
    decision: { id: raw.decision.id, page: decisionPage(raw.decision.id), record: record.href },
  };
}

function applyView(entry, raw, preset) {
  const { grade, ...view } = gradeView(raw, preset);
  guard(grade === entry.grade, "the service answered for another grade than the one paid for");
  Object.assign(entry, view);
  entry.phase = view.state === "graded" ? "completed" : view.state === "failed" ? "payment_failed" : "pending";
}

async function read(entry, preset, deps) {
  try {
    const response = await deps.fetchImpl(statusUrl(entry.grade), { method: "GET", redirect: "error", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) {
      await response.body?.cancel();
      entry.readError = `answered ${response.status}`;
      return;
    }
    applyView(entry, await jsonBody(response), preset);
    delete entry.readError;
  } catch (error) {
    entry.readError = safeError(error);
  }
}

/** Reads each grade until it is decided or the wait is over. A grade the service has never shown needs a person. */
async function settle(entries, manifest, save, deps, waitSeconds) {
  const deadline = deps.now() + waitSeconds * 1000;
  for (;;) {
    for (const entry of entries.filter(readable)) await read(entry, manifest.preset, deps);
    const waiting = entries.filter(readable);
    if (waiting.length === 0 || deps.now() >= deadline) {
      for (const entry of waiting) if (!entry.state) entry.phase = "manual_reconciliation";
      return save();
    }
    await save();
    await deps.sleep(Math.min(5000, deadline - deps.now()));
  }
}

async function submit(entry, request, header, preset, deps) {
  const response = await deps.fetchImpl(preset.endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(150_000),
    headers: { "content-type": "application/json", "PAYMENT-SIGNATURE": header },
    body: canonical(request),
  });
  entry.httpStatus = response.status;
  // The desk answers these before it settles, and cancels the payment on a 403, so nothing was charged.
  if ([400, 402, 403].includes(response.status)) {
    const reply = await jsonBody(response).catch(() => ({}));
    entry.phase = "payment_rejected";
    entry.error = `the service answered ${response.status}${typeof reply.error === "string" ? `: ${safeError(reply.error)}` : ""}`;
    return;
  }
  guard([200, 202, 409, 502].includes(response.status), `the service answered ${response.status}; the payment may have gone through`);
  applyView(entry, await jsonBody(response), preset);
}

/** The request each unpaid entry sends, rebuilt from the case files. */
function requestsOf(manifest) {
  const ids = [...new Set(manifest.entries.filter((entry) => UNPAID.includes(entry.phase)).map((entry) => entry.case))];
  if (ids.length === 0) return new Map();
  const { entries, problem } = selectEntries({ sets: manifest.sets, cases: ids });
  guard(!problem, problem);
  return new Map(entries.map((entry) => [key(entry), entry]));
}

async function stop(manifest, save, deps, reason) {
  manifest.stopped = { at: timestamp(deps.now), reason };
  await save();
}

async function pay(manifest, save, deps, waitSeconds) {
  const requests = requestsOf(manifest);
  let account;
  for (const entry of manifest.entries) {
    if (!UNPAID.includes(entry.phase)) continue;
    const pending = manifest.entries.filter((item) => item.phase === "pending");
    if (pending.length > 0) await settle(pending, manifest, save, deps, 0);
    const undecided = manifest.entries.filter((item) => item.phase === "pending").length;
    if (undecided >= MAX_UNDECIDED) return stop(manifest, save, deps, `${undecided} paid grades are still undecided; --resume reads them and --continue pays the rest`);
    const unchecked = manifest.entries.find((item) => item.phase === "completed" && item.path === "with-checks" && !item.checks);
    if (unchecked) return stop(manifest, save, deps, `the service decided ${key(unchecked)} without running its checks, so the with-checks path is not being measured`);
    delete entry.error;
    try {
      const built = requests.get(key(entry));
      guard(built?.payloadHash === entry.payloadHash, `${key(entry)} changed since the run was planned`);
      const accept = await offered(manifest.preset, deps);
      account ??= await payer(manifest, save, deps);
      const payment = await signPayment(account, manifest.preset, accept, async () => {
        const reserved = BigInt(manifest.reservedUnits) + BigInt(manifest.preset.priceUnits);
        guard(reserved <= BigInt(manifest.budgetUnits), `the next grade would pass the budget of ${usd(manifest.budgetUnits)}`);
        manifest.reservedUnits = reserved.toString();
        entry.phase = "signing";
        entry.attemptedAt = timestamp(deps.now);
        await save();
      });
      entry.grade = payment.grade;
      entry.phase = "submitted";
      await save();
      await submit(entry, built.request, payment.header, manifest.preset, deps);
    } catch (error) {
      entry.error = safeError(error);
      entry.phase = entry.attemptedAt ? "manual_reconciliation" : "blocked_before_payment";
    }
    await save();
    if (readable(entry)) await settle([entry], manifest, save, deps, waitSeconds);
    if (!["completed", "pending"].includes(entry.phase)) return stop(manifest, save, deps, `${key(entry)} ended ${entry.phase.replaceAll("_", " ")}`);
  }
}

function loaded(manifest) {
  guard(manifest?.version === 1 && manifest.mode === "execute" && Array.isArray(manifest.entries) && manifest.entries.length > 0, "not a run manifest");
  guard(canonical(manifest.preset) === canonical(presetFor(manifest.preset?.payOn)), "the manifest's payment terms differ from this runner's");
  guard(manifest.entries.every((entry) => entry.grade === undefined || GRADE.test(entry.grade)), "the manifest holds a malformed grade id");
  return manifest;
}

async function writeManifest(path, manifest, now) {
  manifest.updatedAt = timestamp(now);
  const temporary = `${path}.${randomUUID()}.tmp`;
  const file = await open(temporary, "wx", 0o600);
  try {
    await file.writeFile(`${JSON.stringify(manifest, null, 2)}\n`);
    await file.sync();
  } finally {
    await file.close();
  }
  await rename(temporary, path);
  const directory = await open(dirname(path), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}

export async function runBench(options, injected = {}) {
  const deps = {
    fetchImpl: globalThis.fetch,
    getAccount: () => accountFromFile(),
    readFunds,
    now: Date.now,
    sleep: (ms) => new Promise((done) => setTimeout(done, ms)),
    ...injected,
  };
  const waitSeconds = options.waitSeconds ?? 180;
  guard(["execute", "resume", "continue"].includes(options.mode), `unknown mode ${options.mode}`);
  guard(options.output, "--output names the run's manifest");
  const path = resolve(options.output);
  await mkdir(dirname(path), { recursive: true });
  const lock = await open(`${path}.lock`, "wx", 0o600).catch(() => {
    throw new RunError(`${options.output}.lock exists: a runner is using this manifest, or one stopped without removing it. Remove the lock once none is running.`);
  });
  try {
    const existing = await readFile(path, "utf8").catch((error) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    let manifest;
    const save = () => writeManifest(path, manifest, deps.now);
    if (options.mode === "execute") {
      guard(existing === undefined, `${options.output} exists: --resume reads its grades and --continue pays for the ones it never signed`);
      const budget = units(options.budgetUsd);
      const plan = planRun(options, deps.now);
      guard(budget >= BigInt(plan.plannedUnits), `the budget of ${usd(budget)} is below the run's ${usd(plan.plannedUnits)}`);
      manifest = { ...plan, mode: "execute", budgetUnits: budget.toString(), reservedUnits: "0" };
      await save();
      await pay(manifest, save, deps, waitSeconds);
      return manifest;
    }
    guard(existing !== undefined, `${options.output} does not exist`);
    manifest = loaded(JSON.parse(existing));
    // A crash between recording a payment and keeping its grade id leaves no grade to read.
    for (const entry of manifest.entries) if (entry.phase === "signing") entry.phase = "manual_reconciliation";
    await settle(manifest.entries, manifest, save, deps, waitSeconds);
    if (options.mode === "resume") return manifest;
    const held = manifest.entries.filter((entry) => NEEDS_A_PERSON.includes(entry.phase));
    guard(held.length === 0, `${held.length} grades may have been paid without a verdict, so nothing more is paid: ${held.slice(0, 3).map(key).join(", ")}`);
    delete manifest.stopped;
    await pay(manifest, save, deps, waitSeconds);
    return manifest;
  } finally {
    await lock.close();
    await unlink(`${path}.lock`);
  }
}

export function summary(manifest) {
  const phases = Object.entries(Object.groupBy(manifest.entries, (entry) => entry.phase)).map(([phase, group]) => `${phase.replaceAll("_", " ")} ${group.length}`);
  const lines = [`${phases.join(", ")}. Reserved ${usd(manifest.reservedUnits)} of the ${usd(manifest.budgetUnits)} ${manifest.preset.token} budget.`];
  if (manifest.stopped) lines.push(`Stopped: ${manifest.stopped.reason}.`);
  for (const entry of manifest.entries.filter((item) => item.error && item.phase !== "completed").slice(0, 5)) lines.push(`${key(entry)}: ${entry.error}`);
  return lines.join("\n");
}

export function optionsFrom(argv) {
  const { values: args } = parseArgs({
    args: argv,
    options: {
      dry: { type: "boolean" },
      execute: { type: "boolean" },
      resume: { type: "boolean" },
      continue: { type: "boolean" },
      "held-out": { type: "boolean" },
      "pay-on": { type: "string" },
      path: { type: "string" },
      family: { type: "string", multiple: true },
      case: { type: "string", multiple: true },
      "budget-usd": { type: "string" },
      output: { type: "string" },
      "wait-seconds": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (args.help) return { mode: "help" };
  const modes = ["dry", "execute", "resume", "continue"].filter((mode) => args[mode]);
  guard(modes.length === 1, "choose one of --dry, --execute, --resume and --continue");
  const [mode] = modes;
  const selection = args["held-out"] || args["pay-on"] || args.path || args.family || args.case || args["budget-usd"];
  guard(!["resume", "continue"].includes(mode) || !selection, "the manifest fixes the selection, the lane and the budget");
  guard(mode === "dry" || args.output, "--output names the run's manifest");
  guard(mode !== "execute" || args["budget-usd"], "--execute needs --budget-usd");
  const wait = args["wait-seconds"] ?? "180";
  guard(/^\d{1,3}$/.test(wait) && Number(wait) <= 900, "--wait-seconds is 0 to 900");
  return {
    mode,
    heldOut: args["held-out"] ?? false,
    payOn: args["pay-on"],
    path: args.path,
    families: args.family,
    cases: args.case,
    budgetUsd: args["budget-usd"],
    output: args.output,
    waitSeconds: Number(wait),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = optionsFrom(process.argv.slice(2));
    if (options.mode === "help") console.log(USAGE);
    else if (options.mode === "dry") console.log(dryRun(options));
    else {
      const manifest = await runBench(options);
      console.log(summary(manifest));
      if (manifest.entries.some((entry) => entry.phase !== "completed")) process.exitCode = 2;
    }
  } catch (error) {
    console.error(safeError(error));
    process.exitCode = 1;
  }
}
