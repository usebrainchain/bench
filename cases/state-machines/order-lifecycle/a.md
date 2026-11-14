```python
TRANSITIONS = {
    "created": {"pay": "paid", "cancel": "cancelled"},
    "paid": {"ship": "shipped", "cancel": "refunded", "refund": "refunded"},
    "shipped": {"deliver": "delivered"},
    "delivered": {"refund": "refunded"},
}
EVENTS = {"pay", "ship", "deliver", "cancel", "refund"}
FINAL = {"cancelled", "refunded"}


def apply_events(events):
    state = "created"
    log = []
    for event in events:
        if state in FINAL:
            log.append(f"ignored {event} in {state}")
            continue
        if event not in EVENTS:
            raise ValueError(f"unknown event: {event!r}")
        target = TRANSITIONS[state].get(event)
        if target is None:
            log.append(f"ignored {event} in {state}")
        else:
            log.append(f"{state} -> {target}")
            state = target
    return state, log
```

Final states short-circuit: once an order is cancelled or refunded, every later event is logged as ignored and nothing else is looked up.
