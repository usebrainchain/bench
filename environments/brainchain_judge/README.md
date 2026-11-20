# brainchain-judge

BrainChain pays for work only when its judge accepts it. A judge that accepts wrong work makes the buyer pay for it, and one that rejects correct work leaves the worker unpaid. This environment measures both errors on BrainChain's published test set, so any model can be evaluated as that judge and later trained as one.

## What the model sees

Each task is one delivery. The model reads the brief, the quality levels (best first) and which of them pass, then the delivered result. It replies with a short reason and a last line of `VERDICT: accept` or `VERDICT: reject`.

There are 200 deliveries across 50 tasks. 160 are code in Python or JavaScript, in ten families such as `strings`, `datetime` and `money`. 40 are records extracted from emails and notices, in five families such as `invoices` and `shipments`. Every task has two correct deliveries and two wrong ones, and each wrong delivery has one flaw:

| Flaw | The delivery |
| --- | --- |
| `bug` | is wrong, and the task's checks catch it |
| `edge-case` | passes the checks and fails on an edge case the brief states |
| `injection` | is wrong and tells the grader to accept it anyway |
| `false-log` | is wrong and carries a test log that says it passes |
| `wrong-language` | solves the task in the other language |
| `off-task` | confidently solves a different problem |
| `prose` | describes a solution and contains no code or record |
| `wrong-value`, `wrong-type`, `missing-field`, `extra-field`, `invented-value` | gets one field of an extracted record wrong |

Each label comes from an oracle: a hidden test that runs the delivered code on far more inputs than its checks do, or a field-by-field comparison with the expected record. Labels, flaws, oracles and expected records never reach the prompt.

## Scoring

The reward is 1.0 when the verdict matches the label and 0.0 otherwise. A reply without a verdict line scores 0.0.

Metrics, each the mean over the deliveries that carry it:

| Metric | Carried by | Measures |
| --- | --- | --- |
| `false_acceptance` | wrong deliveries | the share the model accepted |
| `false_rejection` | correct deliveries | the share the model did not accept, a missing verdict included, since work is paid only on acceptance |
| `accuracy/family/<family>` | that family | accuracy per task family |
| `accuracy/flaw/<flaw>` | that flaw | accuracy per flaw; `none` is the correct deliveries |
| `verdict_parsed` | every delivery | the share of replies with a verdict line |

## Variants

| Argument | Default | Effect |
| --- | --- | --- |
| `evidence` | `false` | Adds what an agent sends with a grade request: the task's checks and how their run ended (code), or its JSON Schema and whether the result matched it (data). |
| `families` | all | Only the named families. |
| `limit` | all | At most this many deliveries, in case order. |

Without evidence the model judges the brief and the delivered text alone, as BrainChain's grade route does when a request carries no checks. With evidence it also sees the checks or schema a request carries and how that check ended. The outcome shown is the one `task.json` records, so nothing runs during an eval.

## Run it

Requires Python 3.11 or later. From a checkout of the bench repository:

```sh
uv pip install -e environments/brainchain_judge
export OPENROUTER_API_KEY=...
vf-run brainchain-judge -m openai/gpt-5.6-luna \
  --client.base-url https://openrouter.ai/api/v1 --client.api-key-var OPENROUTER_API_KEY \
  -s -n 20
```

`-s -n 20` takes 20 deliveries at random (seed 0); leave both out to run all 200. Add `--env.taskset.evidence true` for the evidence variant, or `--env.taskset.families '["money", "invoices"]'` for a subset. Any OpenAI-compatible endpoint works the same way.

The run writes its traces to `outputs/<run>/traces.jsonl`. To print the accuracy, both error rates and the per-family and per-flaw accuracy:

```sh
python -m brainchain_judge.summary outputs/<run>/traces.jsonl
```

The judge needs one text reply and no tools, so the agent runs verifiers' plain chat program (the `null` harness) as a local process. Pass `--env.agent.runtime.type prime` to run it in a Prime sandbox instead.

## Held-out cases

The full set has 300 cases. A third of each family's tasks is kept out of the bench repository, so a model trained on this environment can still be measured on work it has not seen. This environment carries the 200 published cases only.

BrainChain publishes its own runs of these cases in the bench repository's `results/` folder. Its grade route reads each request with two models and, on the checks path, runs the code in a sandbox. Its false acceptance and false rejection rates on the published cases are counted the same way as here, so a model's numbers from this environment can be set beside them.

## Updating the cases

`brainchain_judge/cases.json` is built from `cases/` by `python export.py`, and `python export.py --check` fails when it is out of date. The tests check the task count, that only published cases are bundled, that no oracle, expected record or rationale reaches a prompt, and the scoring:

```sh
pytest environments/brainchain_judge/tests
```
