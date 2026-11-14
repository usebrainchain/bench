```python
class _Order:
    _moves = {
        "created": {"pay": "paid", "cancel": "cancelled"},
        "paid": {"ship": "shipped", "cancel": "refunded", "refund": "refunded"},
        "shipped": {"deliver": "delivered"},
        "delivered": {"refund": "refunded"},
        "cancelled": {},
        "refunded": {},
    }
    _events = frozenset({"pay", "ship", "deliver", "cancel", "refund"})

    def __init__(self):
        self.state = "created"
        self.log = []

    def handle(self, event):
        if event not in self._events:
            raise ValueError(f"{event!r} is not an order event")
        target = self._moves[self.state].get(event)
        if target is None:
            self.log.append(f"ignored {event} in {self.state}")
            return
        self.log.append(f"{self.state} -> {target}")
        self.state = target


def apply_events(events):
    order = _Order()
    for event in events:
        order.handle(event)
    return order.state, order.log
```
