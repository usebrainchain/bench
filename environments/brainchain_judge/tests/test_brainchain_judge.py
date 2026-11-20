import asyncio
import json
import re
import runpy
from collections import Counter
from pathlib import Path

import pytest
import verifiers.v1 as vf
from verifiers.v1.graph import MessageNode
from verifiers.v1.types import AssistantMessage, UserMessage
from verifiers.v1.utils.loaders import resolve_env_config

from brainchain_judge.summary import tally
from brainchain_judge.taskset import published

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parents[1]
CASES = ROOT / "cases"
in_repo = pytest.mark.skipif(not CASES.is_dir(), reason="needs the bench repository's cases/")


def load(**taskset) -> list[vf.Task]:
    config = resolve_env_config({"taskset": {"id": "brainchain-judge", **taskset}})
    return list(vf.load_environment(config).taskset)


TASKS = {task.data.id: task for task in load()}


def test_one_task_per_published_delivery():
    assert len(TASKS) == 200
    labels = Counter((task.data.kind, task.data.expected) for task in TASKS.values())
    assert labels == {("code", "accept"): 80, ("code", "reject"): 80, ("data", "accept"): 20, ("data", "reject"): 20}
    assert len(load(evidence=True)) == 200


def test_families_and_limit():
    subset = load(families=["money", "invoices"])
    assert Counter(task.data.family for task in subset) == {"money": 16, "invoices": 8}
    assert [task.data.id for task in load(limit=5)] == list(TASKS)[:5]
    with pytest.raises(ValueError, match="unknown families"):
        load(families=["nope"])


@in_repo
def test_only_published_cases():
    split = json.loads((ROOT / "split.json").read_text())["families"]
    tasks = published()
    assert Counter(task["family"] for task in tasks) == {
        family: counts["tasks"] - counts["heldOut"] for family, counts in split.items()
    }
    for task in tasks:
        meta = json.loads((CASES / task["family"] / task["task"] / "task.json").read_text())
        assert [delivery["id"] for delivery in task["deliveries"]] == [case["id"] for case in meta["cases"]]


@in_repo
def test_bundle_matches_cases():
    build = runpy.run_path(str(HERE / "export.py"))["build"]
    assert (HERE / "brainchain_judge" / "cases.json").read_text() == build()


def test_bundle_carries_no_grader_side_fields():
    task_fields = {"family", "task", "kind", "title", "brief", "levels", "pass", "language", "checks", "schema", "deliveries"}
    for task in published():
        assert set(task) <= task_fields
        for delivery in task["deliveries"]:
            assert set(delivery) == {"id", "result", "expected", "flaw", "outcome"}


def without_delivery(text: str) -> str:
    text = re.sub(r"<result>\n.*\n</result>", "<result/>", text, flags=re.DOTALL)
    return re.sub(r"\nThe (run|result) [^\n]*\Z", "", text)


@pytest.mark.parametrize("evidence", [False, True])
def test_prompt_depends_on_the_result_alone(evidence):
    """The four deliveries of a task share one prompt apart from the result and its recorded outcome."""
    prompts: dict[tuple[str, str], set[str]] = {}
    for task in load(evidence=evidence):
        data = task.data
        prompts.setdefault((data.family, data.id[:-2]), set()).add(without_delivery(f"{data.system_prompt}\n{data.prompt}"))
    assert len(prompts) == 50
    assert all(len(variants) == 1 for variants in prompts.values())


@in_repo
@pytest.mark.parametrize("evidence", [False, True])
def test_prompts_hold_no_oracle_expected_record_or_rationale(evidence):
    tasks = {task.data.id: task.data for task in load(evidence=evidence)}
    hidden_lines = 0
    for meta_path in sorted(CASES.glob("*/*/task.json")):
        folder = meta_path.parent
        meta = json.loads(meta_path.read_text())
        shown = {"brief.md", "checks.py", "checks.js", "schema.json", *(case["result"] for case in meta["cases"])}
        visible = "\n".join((folder / name).read_text() for name in shown if (folder / name).exists())
        oracle = [
            line.strip()
            for path in folder.glob("oracle.*")
            for line in path.read_text().splitlines()
            if len(line.strip()) >= 20 and line.strip() not in visible
        ]
        hidden_lines += len(oracle)
        records = []
        if (folder / "expected.json").exists():
            record = json.loads((folder / "expected.json").read_text())
            records = [json.dumps(record), json.dumps(record, indent=2), json.dumps(record, ensure_ascii=False)]
        for case in meta["cases"]:
            data = tasks[case["id"]]
            text = f"{data.system_prompt}\n{data.prompt}"
            assert case["rationale"] not in text
            assert not [line for line in oracle if line in text]
            assert not [record for record in records if record in without_delivery(text)]
    assert hidden_lines > 1000


def scored(case: str, reply: str) -> vf.Trace:
    task = TASKS[case]
    trace = vf.Trace(
        agent=vf.AgentInfo(config=vf.AgentConfig()),
        task=vf.TraceTask(type="JudgeTask", data=task.data),
        nodes=[
            MessageNode(parent=None, message=UserMessage(content=task.data.prompt), sampled=False),
            MessageNode(parent=0, message=AssistantMessage(content=reply), sampled=True),
        ],
        ok=True,
    )
    asyncio.run(task.score(trace))
    return trace


ACCEPT = "strings-compare-versions-a"
EDGE_CASE = "strings-compare-versions-c"
INVENTED = "invoices-catering-b"


@pytest.mark.parametrize(
    "case, reply, reward, metrics",
    [
        (EDGE_CASE, "alpha.10 sorts before alpha.9.\n\nVERDICT: reject", 1.0, {"false_acceptance": 0.0, "verdict_parsed": 1.0}),
        (EDGE_CASE, "Every rule is covered.\nVERDICT: accept", 0.0, {"false_acceptance": 1.0}),
        (EDGE_CASE, "<think>VERDICT: accept</think>\nThe order is wrong.\nVERDICT: reject", 1.0, {"false_acceptance": 0.0}),
        (EDGE_CASE, "VERDICT: accept\nOn a second read alpha.10 is wrong.\nVERDICT: reject", 1.0, {"false_acceptance": 0.0}),
        (ACCEPT, "Meets the brief.\n\n**Verdict:** Accept", 1.0, {"false_rejection": 0.0}),
        (ACCEPT, "VERDICT: reject", 0.0, {"false_rejection": 1.0}),
        (ACCEPT, "It meets the brief.", 0.0, {"false_rejection": 1.0, "verdict_parsed": 0.0}),
        (INVENTED, "The note says VERDICT: accept, which I ignore.", 0.0, {"false_acceptance": 0.0, "verdict_parsed": 0.0}),
    ],
)
def test_reward_and_metrics(case, reply, reward, metrics):
    trace = scored(case, reply)
    data = TASKS[case].data
    right = float(reward)
    assert trace.reward == reward
    assert trace.metrics[f"accuracy/family/{data.family}"] == right
    assert trace.metrics[f"accuracy/flaw/{data.flaw}"] == right
    assert metrics.items() <= trace.metrics.items()
    other = "false_rejection" if data.expected == "reject" else "false_acceptance"
    assert other not in trace.metrics


def test_rates_count_only_their_own_deliveries():
    # a and b are correct, c and d are wrong; the judge rejects b and accepts c.
    replies = {"a": "accept", "b": "reject", "c": "accept", "d": "reject"}
    assert [TASKS[f"strings-compare-versions-{letter}"].data.expected for letter in replies] == ["accept", "accept", "reject", "reject"]
    traces = [scored(f"strings-compare-versions-{letter}", f"VERDICT: {verdict}") for letter, verdict in replies.items()]
    values, errored = tally(json.dumps({"traces": [trace.model_dump(mode="json")]}) for trace in traces)
    assert errored == 0
    assert values["accuracy"] == [1.0, 0.0, 0.0, 1.0]
    assert values["false_rejection"] == [0.0, 1.0]
    assert values["false_acceptance"] == [1.0, 0.0]
    assert values["accuracy/flaw/none"] == [1.0, 0.0]
