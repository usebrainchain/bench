```python
_NEXT = {
    ("created", "pay"): "paid",
    ("created", "cancel"): "cancelled",
    ("paid", "ship"): "shipped",
    ("paid", "cancel"): "refunded",
    ("paid", "refund"): "refunded",
    ("shipped", "deliver"): "delivered",
    ("delivered", "refund"): "refunded",
}
_KNOWN = frozenset(event for _, event in _NEXT)


def apply_events(events):
    state, log = "created", []
    for event in events:
        if event not in _KNOWN:
            raise ValueError(f"unknown event {event!r} in state {state}")
        target = _NEXT.get((state, event))
        if target is None:
            log.append(f"ignored {event} in {state}")
            continue
        log.append(f"{state} -> {target}")
        state = target
    return state, log
```

The table is keyed by (state, event), so any pair it does not list, including everything from cancelled and refunded, is logged as ignored. Event names are validated before the lookup, in every state.
