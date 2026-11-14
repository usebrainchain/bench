trip = ["retry 100", "retry 200", "trip"]
assert plan_retries([]) == ("closed", [])
assert plan_retries(["ok", "tick"]) == ("closed", ["pass", "idle"])
assert plan_retries(["fail", "fail", "ok"]) == ("closed", ["retry 100", "retry 200", "pass"])
assert plan_retries(["fail", "ok", "fail", "fail"]) == ("closed", ["retry 100", "pass", "retry 100", "retry 200"])
assert plan_retries(["fail"] * 3 + ["ok", "tick", "tick"]) == ("half-open", trip + ["reject", "wait", "probe"])
assert plan_retries(["fail"] * 3 + ["tick", "tick", "ok"]) == ("closed", trip + ["wait", "probe", "close"])
assert plan_retries(["fail"] * 3 + ["tick", "tick", "fail"]) == ("open", trip + ["wait", "probe", "trip"])
try:
    plan_retries(["error"])
except ValueError:
    pass
else:
    raise AssertionError("an unknown event did not raise ValueError")
