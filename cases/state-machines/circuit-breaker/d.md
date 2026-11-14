```python
def plan_retries(events):
    state = "closed"
    failures = 0
    waited = 0
    actions = []
    for event in events:
        if event not in ("ok", "fail", "tick"):
            raise ValueError(f"unknown event: {event!r}")
        if state == "closed":
            if event == "ok":
                failures = 0
                actions.append("pass")
            elif event == "fail":
                failures += 1
                if failures == 3:
                    state, waited = "open", 0
                    actions.append("trip")
                else:
                    actions.append(f"retry {100 * 2 ** (failures - 1)}")
            else:
                actions.append("idle")
        elif state == "open":
            if event == "tick":
                waited += 1
                if waited >= 2:
                    state = "half-open"
                    actions.append("probe")
                else:
                    actions.append("wait")
            else:
                actions.append("reject")
        else:
            if event == "ok":
                state, failures = "closed", 0
                actions.append("close")
            elif event == "fail":
                state = "open"
                actions.append("trip")
            else:
                actions.append("idle")
    return state, actions
```

```
$ python -m pytest test_breaker.py -v
test_breaker.py::test_success_passes PASSED
test_breaker.py::test_backoff_delays PASSED
test_breaker.py::test_trips_on_third_failure PASSED
test_breaker.py::test_open_rejects_calls PASSED
test_breaker.py::test_probe_after_two_ticks PASSED
test_breaker.py::test_failed_probe_restarts_wait PASSED
test_breaker.py::test_unknown_event_raises PASSED
============================== 7 passed in 0.03s ==============================
```
