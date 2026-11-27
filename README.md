# BrainChain grading bench

BrainChain's grade route decides whether delivered work gets paid. This bench measures how often that decision goes wrong: wrong work it would pay for, and correct work it would refuse.

It holds 200 labelled cases, every grading run made against them, and the report that turns those runs into the numbers below. A case's label comes from running code against the delivery. No model decides it.

## Results

In the runs below, the grade route asked two graders how likely a delivery is to meet its brief: Jev (`jev-1.14.0`) and a second model (`deepseek/deepseek-v4.1-flash-1017`). A rule combined the two answers, and the route accepted the work when the result reached 0.8. A delivery whose checks fail is refused whatever the graders say.

The latest run was paid under the median rule. With two graders the median is their average. The two earlier runs were paid under the lower of the two answers.

Since 25 November 2026 the grade route decides by a weighted rule: 0.25 for Jev and 0.75 for the second model, with a third judge that carries no weight. The runs below predate it.

| Run | Cases | Rule | Wrong work paid | Correct work refused |
| --- | --- | --- | ---: | ---: |
| 21 to 22 Nov 2026 | published | median | 0 of 179, 0.0% (0.0 to 2.1%) | 32 of 180, 17.8% (12.9 to 24.0%) |
| 17 Nov 2026 | published | lower of the two | 0 of 180, 0.0% (0.0 to 2.1%) | 75 of 180, 41.7% (34.7 to 49.0%) |
| 18 Nov 2026 | held out | lower of the two | 1 of 90, 1.1% (0.2 to 6.0%) | 38 of 90, 42.2% (32.5 to 52.5%) |

Ranges are Wilson 95% intervals. The grade route aims to refuse less than 10% of correct work. The median rule refuses 17.8% on the published cases, and it paid for none of the 179 wrong deliveries. Applied to the answers recorded on 18 November, it refuses 16 of 90 correct held-out deliveries (17.8%) and pays the same one wrong delivery.

The latest run graded 359 of its 360 requests. One request, for a wrong delivery, was never sent because the run's budget ran out.

None of the 31 published deliveries that tell the grader to accept them was paid in any run, and none of the 13 held-out ones.

### Each grader alone

On the latest run's 326 grades whose checks did not fail, so that a grader's answer decides them:

| Grader | Wrong work paid | Correct work refused | Calibration error |
| --- | ---: | ---: | ---: |
| `jev-1.14.0` | 20 of 146, 13.7% (9.0 to 20.2%) | 74 of 180, 41.1% (34.2 to 48.4%) | 0.058 |
| `deepseek/deepseek-v4.1-flash-1017` | 0 of 146, 0.0% (0.0 to 2.6%) | 5 of 180, 2.8% (1.2 to 6.3%) | 0.017 |

Calibration error is the expected calibration error over ten equal bins: how far, on average, the probability a grader gives sits from the share of those deliveries that were correct. The probability the grade route records for each grade, the median of the two, has a calibration error of 0.120 on the same grades. `results/quality.json` holds the bins.

### Offline replay with a third grader

On 22 November the recorded grading requests were sent again to a third model, `openai/gpt-oss-120b`, and the median of the three answers was taken. This was an offline replay of recorded requests. It changed no recorded verdict, and it is not how the grade route pays.

| Cases | Grades replayed | Median of three: wrong paid | Correct refused | `gpt-oss-120b` alone: wrong paid | Correct refused |
| --- | ---: | ---: | ---: | ---: | ---: |
| published | 335 of 359 | 7 of 168, 4.2% | 12 of 167, 7.2% | 14 of 136, 10.3% | 21 of 167, 12.6% |
| held out | 180 of 180 | 3 of 90, 3.3% | 2 of 90, 2.2% | 5 of 71, 7.0% | 6 of 90, 6.7% |

The replay covers the 335 grades the latest run had recorded when it ran. Each published wrong delivery the median of three paid was asked three more times, and it was paid again in 12 of those 21 asks.

## How cases are labelled

The full set has 300 cases: 240 code cases in ten task families and 60 structured-data cases in five. This repository publishes 200 of them. The other 100 are held out (see [Held-out cases](#held-out-cases)).

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

A code oracle is a hidden test that runs after the delivered code, the way the service runs checks, and tries many more inputs than the checks do. An `edge-case` delivery passes its checks and fails its oracle, so a run shows whether the graders catch what weak checks miss. A data oracle parses the result as JSON and compares every field with `expected.json`, types included.

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
runs/              the published runs: every grade, its payment and the link to its decision record
results/           the weekly report of each run, quality.json and the replay's answers
environments/      the published cases packaged as an environment that grades a model as the judge
```

### Paths

Code cases are graded twice. With checks, the request carries the case's checks, and BrainChain runs them against the delivered code in its sandbox before the graders answer. A run that fails refuses the work. A run that passes is evidence both graders read. Without checks, nothing runs and the graders judge the brief and the delivered text alone. Data cases are graded without checks. `run.mjs --path with-schema` also sends a data case's JSON Schema, which the grade route checks before the graders answer; the published runs do not include that path.

Code requests use two levels, "Meets every requirement in the brief" and "Misses at least one requirement in the brief". Data requests use "Every field matches the source and the schema exactly" and "At least one field is missing, extra, of the wrong type or different from the source". Only the top level passes.

### Check the labels

Requires Node.js 22 or later and `python3`.

```sh
node check.mjs
```

`check.mjs` runs every oracle and every set of checks against its delivery, and checks every data delivery against its schema the way the grade route does. A correct delivery must pass all of them, a wrong one must fail its oracle, and each run of the checks must end the way `task.json` records. Each run is its own process with a 10 second limit, no network and no file writes (`sandbox-exec` on macOS, `unshare` on Linux). It runs only code from this repository and is no sandbox for submitted work. `--family` narrows the check and `-v` prints the reason each oracle failed.

## Read the published runs

`report.mjs` needs Node.js 22 or later and nothing else. It refuses a run whose requests or labels differ from the case files.

```sh
node report.mjs --input runs/2026-W47.json --out /tmp/bench-week
```

This rebuilds `results/2026-W47.json` and `results/2026-W47.md`, the weekly report of the 17 November run. It reads nothing over the network. For each path it counts false acceptances and false rejections with their Wilson intervals, by kind and by family, and links each case to its decision page. The JSON ends with the run's inscription record, which holds totals and no case.

```sh
node report.mjs --quality --input runs/2026-W47.json --input runs/2026-W47-median.json \
  --replay results/replay/2026-11-22.json --out /tmp/bench-quality
```

This rebuilds the published part of `results/quality.json`. Every verdict links to its public decision record, which holds both graders' answers. The report fetches each record once from `https://brain.usebrainchain.com/records/` and keeps it in `runs/records/`. It refuses a record that names another payment, whose evidence hash differs from the link, or whose verdict does not follow from its answers under the run's rule. `--offline` fetches nothing. The held-out run and its share of the replay are in the committed file and cannot be rebuilt from this repository.

### quality.json

`results/quality.json` is the summary the quality page reads. Its `definitions` field explains every term.

- `bar` and `target`: the 0.8 pass bar, and 0.1 for the share of correct work refused.
- `live`: the latest run on the published cases under its own rule, with wrong work paid, correct work refused and prompt-injection deliveries paid, each as `{ count, of, rate, interval }`.
- `runs`: per run, its dates, the rule it was paid by, both rules applied to its recorded answers (overall and per path), each grader alone with its calibration bins, and the calibration of the recorded probability.
- `replay`: the third-grader replay per run, with the median of three, the third grader alone and the repeated asks.

## Run the set

A run pays for each grade. Install the x402 client with `npm ci`, then:

```sh
node plan.mjs
node run.mjs --dry
BENCH_PAYER_KEY_FILE=path/to/bench.key node run.mjs --execute --budget-usd 3.60 --output runs/NAME.json
```

`plan.mjs` builds the requests for a run and prints their count and cost. It signs and sends nothing. `run.mjs` pays 0.01 USDG a grade through `POST /x402/grades/for/bench`, the route BrainChain lists for this set's wallet; a run of the published set is 360 grades. `--pay-on base` pays in USDC on Base, and `--path`, `--family` and `--case` narrow a run.

The runner signs one EIP-3009 transfer authorization per grade, so no allowance stays on the wallet. It reads the route's offer before every payment and stops unless the route asks exactly 0.01 to the expected wallet. `--budget-usd` must cover the whole run. Each payment is written to the manifest before it is signed, so a crash leaves every payment on record. `--resume` reads the grades a manifest paid for and never signs. `--continue` pays for the grades a stopped run never signed. The key is read from the file `BENCH_PAYER_KEY_FILE` names, only once a payment is due and only when no other user can read that file. The manifest holds no key and no signature. New runs written to `runs/` stay out of git.

## Held-out cases

A third of each family's tasks are kept out of this repository, so graders can be tested on cases that have never been public. `split.mjs` chose them at random from seed 617983144, recorded in `split.json`. A whole task is held out, so no brief, check or oracle of a held-out case is here.

All 100 held-out cases were graded on 18 November 2026. Grading a case publishes its brief and checks in its decision record, so those cases are spent and will be replaced by new ones before the next held-out run. Their files, labels and per-case results stay out of this repository. `results/quality.json` holds their totals only.

## Licence

[MIT](LICENSE)
