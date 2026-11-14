```python
def plan_retries(events):
    state, failures, ticks, actions = "closed", 0, 0, []
    for event in events:
        if event not in {"ok", "fail", "tick"}:
            raise ValueError(f"not a breaker event: {event!r}")
        if state == "closed":
            if event == "tick":
                action = "idle"
            elif event == "ok":
                failures, action = 0, "pass"
            elif failures < 2:
                failures += 1
                action = f"retry {100 * 2 ** (failures - 1)}"
            else:
                state, ticks, action = "open", 0, "trip"
        elif state == "open":
            if event == "tick":
                ticks += 1
                state, action = ("half-open", "probe") if ticks == 2 else ("open", "wait")
            else:
                action = "reject"
        elif event == "ok":
            state, failures, action = "closed", 0, "close"
        elif event == "fail":
            state, ticks, action = "open", 0, "trip"
        else:
            action = "idle"
        actions.append(action)
    return state, actions
```

The third consecutive failure trips the breaker instead of scheduling another retry, and every way into the open state resets the tick counter.
