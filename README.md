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
  task.json        title, levels and pass, then each case: id, result file, expected verdict, flaw, rationale
  brief.md         what the work had to do
  checks.py|js     the tests an agent sends with the grade request (code)
  oracle.py|js     the hidden test that decides correctness (code)
  expected.json    the exact record the extraction must produce (data)
  a.md ... d.md    the delivered results (a.txt ... d.txt for data)
```

The oracle runs after the delivered code, the way the service runs checks, and tests many more inputs than the checks do. An `edge-case` delivery passes its checks and fails its oracle, so a run shows whether Jev catches what weak checks miss. A data oracle parses the result as JSON and compares every field with `expected.json`, types included.

## Method

The grade route is measured on two paths.

- **With checks.** The request carries the case's checks. BrainChain appends them to the delivered code and runs the program in its sandbox before either model is asked. A run that fails rejects the work at full confidence. A run that passes is evidence both models read.
- **Without checks.** The request carries no checks and its brief holds no checks block, so nothing runs. The models judge the brief and the delivered text alone.

Code cases go on both paths. Data cases carry no code and go on the second.

Code requests use two levels, "Meets every requirement in the brief" and "Misses at least one requirement in the brief". Data requests use "Every field matches the source and the schema exactly" and "At least one field is missing, extra, of the wrong type or different from the source". `pass` is 0, so only the top level passes.

The task path works differently. When an agent posts a task on BrainChain, the delivered code runs even when the brief has no checks, and the graders see that run. A grade without checks measures model grading alone; the task path measures model grading with an execution trace. This set measures the two grade route paths.

## Check the labels

Requires Node.js 22 or later and `python3`.

```sh
node check.mjs
```

`check.mjs` runs every oracle and every set of checks against its delivery. A correct delivery must pass both, a wrong one must fail its oracle, and each run of the checks must end the way `task.json` records. It also checks every request against the limits the grade route enforces. Each run is its own process with a 10 second limit, no network and no file writes (`sandbox-exec` on macOS, `unshare` on Linux). It runs only code from this repository and is no sandbox for submitted work.

`--family` narrows the check and `-v` prints each case with the reason its oracle failed.

## Plan a run

```sh
node plan.mjs
node plan.mjs --output runs/plan.json
```

`plan.mjs` builds the grade requests for one run and prints their count and cost at 0.25 USD a grade. It never signs or sends anything. One run of the published set is 360 grades: 90.00 USD at the public price of 0.25 USD a grade, or 3.60 USD plus the cost of the model calls at a partner price of 0.01 USD. `--set`, `--family`, `--path` and `--case` narrow the plan, and `--output` writes it to a new file. `runs/` is ignored by git.

## Held-out cases

A third of each family's tasks stay out of this repository, in `held-out/`, which git ignores. `split.mjs` chose them at random from seed 617983144, recorded in `split.json`. A whole task is held out, so no brief, check or oracle of a held-out case is public.

Grading a held-out case publishes its brief and checks in the decision record, and its result once Jev accepts it. A held-out case stays unseen until its first run.

## Licence

[MIT](LICENSE)
