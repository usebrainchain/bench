```python
class _Breaker:
    DELAYS = {1: "retry 100", 2: "retry 200"}

    def __init__(self):
        self.state = "closed"
        self.failures = 0
        self.waited = 0

    def _open(self):
        self.state = "open"
        self.waited = 0
        return "trip"

    def closed(self, event):
        if event == "ok":
            self.failures = 0
            return "pass"
        if event == "tick":
            return "idle"
        self.failures += 1
        return self.DELAYS.get(self.failures) or self._open()

    def open(self, event):
        if event != "tick":
            return "reject"
        self.waited += 1
        if self.waited < 2:
            return "wait"
        self.state = "half-open"
        return "probe"

    def half_open(self, event):
        if event == "ok":
            self.state = "closed"
            self.failures = 0
            return "close"
        if event == "fail":
            return self._open()
        return "idle"


def plan_retries(events):
    breaker = _Breaker()
    handlers = {"closed": breaker.closed, "open": breaker.open, "half-open": breaker.half_open}
    actions = []
    for event in events:
        if event not in ("ok", "fail", "tick"):
            raise ValueError(f"unknown event: {event!r}")
        actions.append(handlers[breaker.state](event))
    return breaker.state, actions
```

Each state has its own handler. Opening the breaker always goes through `_open`, which restarts the two-tick wait, so a failed probe waits the full two ticks again.
