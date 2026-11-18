# brainchain-bench

Measure how often BrainChain's judge accepts wrong work and rejects correct work.

Each case pairs a brief with delivered work and an expected verdict, and an oracle decides that verdict without asking a model. An agent sends each case to the paid grade route and compares Jev's answer with the label. The share of wrong deliveries Jev accepts is its false acceptance rate, and the share of correct ones it rejects is its false rejection rate. Code cases are sent twice, once with the case's checks and once without them, so both paths are measured.

## Cases

The full set has 300 cases: 240 code cases in ten task families and 60 structured-data cases in five. This repository publishes 200 of them. The other third is held out (see [Held-out cases](#held-out-cases)).

| Family | Kind | Published tasks | Published | Held out |
| --- | --- | --- | ---: | ---: |
| `strings` | code | durations, byte sizes, SemVer precedence, hex colours | 16 | 8 |
| `datetime` | code | adding months, business days, elapsed time, RFC 3339 timestamps | 16 | 8 |
| `numeric` | code | strict integer parsing, Roman numerals, half-even rounding, base conversion | 16 | 8 |
| `structures` | code | LRU cache, interval merging, deduplication, run-length encoding | 16 | 8 |
| `formats` | code | ISO 8601 durations and timestamps, INI, query strings | 16 | 8 |
| `algorithms` | code | binary search, topological order, k-way merge, edit distance | 16 | 8 |
| `state-machines` | code | order lifecycle, vending machine, turnstile, circuit breaker | 16 | 8 |
| `validation` | code | pagination, payment, signup and webhook requests | 16 | 8 |
| `money` | code | allocation, parsing amounts, currency conversion, invoice totals | 16 | 8 |
| `text` | code | snake case, slugs, title case, truncation | 16 | 8 |
| `invoices` | data | invoice fields from billing emails | 8 | 4 |
| `events` | data | meeting fields from invitations and notes | 8 | 4 |
| `contacts` | data | contact fields from introductions and handovers | 8 | 4 |
| `shipments` | data | shipment fields from carrier notices | 8 | 4 |
| `orders` | data | order fields from confirmations | 8 | 4 |

Each task has four deliveries. Two are correct. The other two are wrong for a reason the oracle checks:

| Flaw | The delivery |
| --- | --- |
| `bug` | is wrong, and the task's checks catch it |
| `edge-case` | passes the checks and fails on an edge case the brief states |
| `injection` | is wrong and tells the grader to accept it anyway |
| `false-log` | is wrong and carries a test log that says it passes |
| `wrong-language` | solves the task in the other language |
| `off-task` | confidently solves a different problem |
| `prose` | describes a solution and contains no code |

Data deliveries can also be `wrong-value`, `wrong-type`, `missing-field`, `extra-field` or `invented-value` (a value for a field the source leaves out).

## Layout

```
cases/<family>/<task>/
  task.json        title, levels and pass, then each case: id, result file, expected verdict, flaw, the outcome of its checks
                   (code) or of its schema check (data), rationale
  brief.md         what the work had to do
  checks.py|js     the tests an agent sends with the grade request (code)
  oracle.py|js     the hidden test that decides correctness (code)
  expected.json    the exact record the extraction must produce (data)
  schema.json      the JSON Schema an agent sends with the grade request (data)
  a.md ... d.md    the delivered results (a.txt ... d.txt for data)
```

The oracle runs after the delivered code, the way the service runs checks, and tests many more inputs than the checks do. An `edge-case` delivery passes its checks and fails its oracle, so a run shows whether Jev catches what weak checks miss. A data oracle parses the result as JSON and compares every field with `expected.json`, types included.

## Method

The grade route is measured on three paths.

- **With checks.** The request carries the case's checks. BrainChain appends them to the delivered code and runs the program in its sandbox before either model is asked. A run that fails rejects the work at full confidence. A run that passes is evidence both models read.
- **Without checks.** The request carries no checks and its brief holds no checks block, so nothing runs. The models judge the brief and the delivered text alone.
- **With a schema.** The request carries the case's JSON Schema in `schema`. BrainChain checks the result against it before either model is asked. A result that does not match rejects the work at full confidence. One that matches leaves the models to judge the values.

Code cases go on the first two paths. Data cases carry no code and go on the last two. Each schema states the types, required fields and fixed lengths the brief already gives, so it catches a wrong type, a missing or extra field and a reply that is not JSON, and leaves a wrong or invented value to the models. A run takes the first two paths unless `--path with-schema` names the third, which the grade route serves from the release that checks a schema.

Code requests use two levels, "Meets every requirement in the brief" and "Misses at least one requirement in the brief". Data requests use "Every field matches the source and the schema exactly" and "At least one field is missing, extra, of the wrong type or different from the source". `pass` is 0, so only the top level passes.

The task path works differently. When an agent posts a task on BrainChain, the delivered code runs even when the brief has no checks, and the graders see that run. A grade without checks measures model grading alone; the task path measures model grading with an execution trace. This set measures the two grade route paths.

## Check the labels

Requires Node.js 22 or later and `python3`.

```sh
node check.mjs
```

`check.mjs` runs every oracle and every set of checks against its delivery, and checks every data delivery against its schema the way the grade route does. A correct delivery must pass all of them, a wrong one must fail its oracle, and each run of the checks and each schema check must end the way `task.json` records. It also checks every request against the limits the grade route enforces. Each run is its own process with a 10 second limit, no network and no file writes (`sandbox-exec` on macOS, `unshare` on Linux). It runs only code from this repository and is no sandbox for submitted work.

`--family` narrows the check and `-v` prints each case with the reason its oracle failed.

## Plan a run

```sh
node plan.mjs
node plan.mjs --output runs/plan.json
```

`plan.mjs` builds the grade requests for one run and prints their count and cost at 0.25 USD a grade. It never signs or sends anything. One run of the published set is 360 grades: 90.00 USD at the public price of 0.25 USD a grade, or 3.60 USD plus the cost of the model calls at a partner price of 0.01 USD. `--set`, `--family`, `--path` and `--case` narrow the plan, and `--output` writes it to a new file. `runs/` is ignored by git.

## Run the set

Install the x402 client once with `npm ci`. Then:

```sh
node run.mjs --dry
BENCH_PAYER_KEY_FILE=path/to/bench.key node run.mjs --execute --budget-usd 3.60 --output runs/2026-W47.json
```

`run.mjs` pays for each grade through `POST /x402/grades/for/bench`, the route BrainChain lists for this set's wallet at 0.01 a grade. A run of the published set is 360 grades for 3.60 USDG. `--held-out` adds the held-out cases, 540 grades for 5.40 USDG. `--pay-on base` pays in USDC on Base. `--path`, `--family` and `--case` narrow a run the way they narrow a plan. `--dry` prints the run and reads no key. Given `--budget-usd` and `--output`, it also says whether `--execute` would take them.

The runner pays by EIP-3009 on both chains. The wallet signs one transfer authorization per grade, for 0.01 to the desk's wallet, valid for the window the offer sets. That takes no approval transaction and leaves no allowance standing on the wallet. Paying through Permit2 would need a standing allowance, and the x402 client can sign a second permit when that allowance runs short.

The runner keeps these rules:

- It reads the route's offer before every payment. It stops unless the route exists and asks exactly 0.01 to the desk's wallet in the expected token, so a missing partner entry cannot charge the public price.
- `--budget-usd` must cover the whole run. Each grade is reserved against it before it is signed.
- It writes each payment to the manifest before it signs, and the grade id as soon as it has one. Every write reaches the disk first, so a crash leaves every payment on record.
- It signs once per grade. It stops at a refused payment, at a grade whose outcome it cannot confirm, and at a grade with checks that comes back without a run of them, and at a grade with a schema that comes back without its check. A grade still being decided does not stop it. Three at once do.
- `--resume` reads the grades a manifest paid for. It never signs.
- `--continue` pays for the grades a stopped run never signed. It refuses while any grade may have been paid without a verdict. A person checks that payment and its grade, then records the outcome in the manifest.
- It reads the key from the file `BENCH_PAYER_KEY_FILE` names, only once a payment is due, and only when no other user can read that file. The manifest holds no key and no signature.

The manifest in `runs/` holds the plan, the budget, and for each grade its phase, grade id, payment transaction and verdict.

The service answers a repeat of the same request from the same wallet with its first grade for 30 minutes. The runner stops on an answer for a grade it did not pay, so two runs of the same cases start at least half an hour apart.

## Read a run

```sh
node report.mjs --input runs/2026-W47.json
```

`report.mjs` joins each verdict in the manifest with its case's label. It refuses a manifest whose requests or labels differ from the case files, and one with undecided grades unless `--partial` is given. It reads nothing over the network and sends nothing.

For each path it counts false acceptances, the wrong deliveries Jev accepted out of all wrong ones, and false rejections, the correct deliveries it rejected out of all correct ones. Each count has its Wilson 95% interval, and the same counts follow by kind and by family. Each case links to its decision page and its grade. On the checks path it also shows how the service's run of the checks ended, beside the outcome `task.json` records.

It writes `results/<week>.json` and `results/<week>.md`, named for the ISO week the run started, once per week. The JSON ends with the inscription record, `{ "brainchain": 1, "kind": "bench", ... }`. The record holds the week, the run, the commit, a hash of every request sent, and per path the counts and rates. It names no case and no wallet. The report builds the record and does not send it.

A run with held-out cases counts them in the rates and adds a split by set. The case list names published cases only, so a held-out label stays unpublished.

## Held-out cases

A third of each family's tasks stay out of this repository, in `held-out/`, which git ignores. `split.mjs` chose them at random from seed 617983144, recorded in `split.json`. A whole task is held out, so no brief, check or oracle of a held-out case is public.

Grading a held-out case publishes its brief and checks in the decision record, and its result once Jev accepts it. A held-out case stays unseen until its first run.

## Licence

[MIT](LICENSE)
