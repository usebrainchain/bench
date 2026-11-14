```python
def turnstile(events):
    state = "locked"
    failures = 0
    outputs = []
    for event in events:
        if event == "reset":
            state, failures = "locked", 0
            outputs.append("reset")
        elif event == "coin":
            if state == "locked":
                state = "unlocked"
                outputs.append("unlock")
            else:
                outputs.append("refund")
        elif event == "push":
            if state == "unlocked":
                state = "locked"
                outputs.append("lock")
            elif state == "alarm":
                outputs.append("deny")
            else:
                failures += 1
                if failures >= 3:
                    state = "alarm"
                    outputs.append("alarm")
                else:
                    outputs.append("deny")
        else:
            raise ValueError(f"unknown event: {event!r}")
    return state, outputs
```

Failed pushes accumulate until a reset, so repeated tampering trips the alarm even if someone pays in between.
