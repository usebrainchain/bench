```python
TABLE = {
    ("locked", "coin"): ("unlocked", "unlock"),
    ("locked", "push"): ("locked", "deny"),
    ("unlocked", "push"): ("locked", "lock"),
    ("unlocked", "coin"): ("unlocked", "refund"),
    ("alarm", "coin"): ("alarm", "refund"),
    ("alarm", "push"): ("alarm", "deny"),
}
ALARM_AFTER = 3


def turnstile(events):
    state, failures, outputs = "locked", 0, []
    for event in events:
        if event == "reset":
            state, failures = "locked", 0
            outputs.append("reset")
            continue
        if (state, event) not in TABLE:
            raise ValueError(f"unknown event {event!r}")
        if state == "locked" and event == "push":
            failures += 1
            if failures == ALARM_AFTER:
                state = "alarm"
                outputs.append("alarm")
                continue
        elif state == "locked" and event == "coin":
            failures = 0
        state, output = TABLE[(state, event)]
        outputs.append(output)
    return state, outputs
```

The table covers the ordinary moves, and the failure counter is handled around it: a locked push counts toward the alarm, a paid unlock and a reset clear it.
