"""Print a run's accuracy, both error rates, and accuracy by family and by flaw.

    python -m brainchain_judge.summary outputs/<run>/traces.jsonl

Each metric is averaged over the traces that carry it, as prime-rl averages them.
"""

import json
import sys
from collections import defaultdict


def tally(lines) -> tuple[dict[str, list[float]], int]:
    values: dict[str, list[float]] = defaultdict(list)
    errored = 0
    for line in lines:
        for trace in json.loads(line)["traces"]:
            reward = trace["rewards"].get("correct")
            if not trace["ok"] or reward is None:
                errored += 1
                continue
            values["accuracy"].append(reward["score"])
            for name, value in trace["metrics"].items():
                values[name].append(value)
    return values, errored


def report(values: dict[str, list[float]], errored: int) -> str:
    head = ["accuracy", "false_acceptance", "false_rejection", "verdict_parsed"]
    rest = sorted(name for name in values if name not in head)
    width = max(map(len, [*head, *rest]))

    def row(name: str) -> str:
        scores = values[name]
        hits = sum(scores)
        return f"{name:<{width}}  {hits / len(scores):6.1%}  {hits:g} of {len(scores)}"

    lines = [row(name) for name in head if values.get(name)]
    lines += [""] + [row(name) for name in rest]
    if errored:
        lines += ["", f"{errored} traces errored and are not counted"]
    return "\n".join(lines)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__.strip())
    with open(sys.argv[1]) as file:
        print(report(*tally(file)))
