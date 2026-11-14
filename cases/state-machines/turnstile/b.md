```python
class _Turnstile:
    def __init__(self):
        self.state = "locked"
        self.failures = 0

    def coin(self):
        if self.state == "locked":
            self.state = "unlocked"
            self.failures = 0
            return "unlock"
        return "refund"

    def push(self):
        if self.state == "unlocked":
            self.state = "locked"
            return "lock"
        if self.state == "alarm":
            return "deny"
        self.failures += 1
        if self.failures == 3:
            self.state = "alarm"
            return "alarm"
        return "deny"

    def reset(self):
        self.state = "locked"
        self.failures = 0
        return "reset"


def turnstile(events):
    gate = _Turnstile()
    handlers = {"coin": gate.coin, "push": gate.push, "reset": gate.reset}
    outputs = []
    for event in events:
        if event not in handlers:
            raise ValueError(f"unknown turnstile event {event!r}")
        outputs.append(handlers[event]())
    return gate.state, outputs
```

Each event maps to one method that returns its output. A paid unlock and a reset both clear the failure count, as the brief requires.
