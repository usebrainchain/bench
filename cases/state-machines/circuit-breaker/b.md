```python
def plan_retries(events):
    state = "closed"
    failures = 0
    ticks_open = 0
    actions = []
    for event in events:
        if event not in ("ok", "fail", "tick"):
            raise ValueError(f"unknown event {event!r}")
        if state == "closed":
            if event == "ok":
                actions.append("pass")
            elif event == "tick":
                actions.append("idle")
            else:
                failures += 1
                if failures >= 3:
                    state = "open"
                    ticks_open = 0
                    actions.append("trip")
                else:
                    actions.append(f"retry {100 * 2 ** (failures - 1)}")
        elif state == "open":
            if event == "tick":
                ticks_open += 1
                if ticks_open == 2:
                    state = "half-open"
                    actions.append("probe")
                else:
                    actions.append("wait")
            else:
                actions.append("reject")
        else:
            if event == "ok":
                state = "closed"
                failures = 0
                actions.append("close")
            elif event == "fail":
                state = "open"
                ticks_open = 0
                actions.append("trip")
            else:
                actions.append("idle")
    return state, actions
```

The failure count tracks recent failures across successes, so a flapping service that alternates between working and failing still trips the breaker. Backoff doubles from 100 ms.
