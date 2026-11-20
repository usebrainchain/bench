"""Bundle the published cases into the package, so the environment installs as one wheel.

Reads cases/ only. Each delivery keeps its label, flaw and recorded outcome; oracles,
expected records and rationales stay out.

    python export.py            write brainchain_judge/cases.json
    python export.py --check    fail when it differs from cases/
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CASES = ROOT / "cases"
OUT = HERE / "brainchain_judge" / "cases.json"
CHECKS = {"python": "checks.py", "javascript": "checks.js"}


def task(path: Path) -> dict:
    meta = json.loads((path / "task.json").read_text())
    kind = meta["kind"]
    entry = {
        "family": meta["family"],
        "task": path.name,
        "kind": kind,
        "title": meta["title"],
        "brief": (path / "brief.md").read_text().strip(),
        "levels": meta["levels"],
        "pass": meta["pass"],
    }
    if kind == "code":
        entry["language"] = meta["language"]
        entry["checks"] = (path / CHECKS[meta["language"]]).read_text().strip()
    else:
        entry["schema"] = (path / "schema.json").read_text().strip()
    entry["deliveries"] = [
        {
            "id": case["id"],
            "result": (path / case["result"]).read_text(),
            "expected": case["expected"],
            "flaw": case["flaw"],
            "outcome": case["checksOutcome" if kind == "code" else "shapeOutcome"],
        }
        for case in meta["cases"]
    ]
    return entry


def build() -> str:
    tasks = [task(meta.parent) for meta in sorted(CASES.glob("*/*/task.json"))]
    return json.dumps({"tasks": tasks}, indent=2, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    data = build()
    if "--check" in sys.argv[1:]:
        if not OUT.exists() or OUT.read_text() != data:
            sys.exit(f"{OUT.relative_to(ROOT)} differs from cases/: run python export.py")
    else:
        OUT.write_text(data)
