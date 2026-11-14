def _oracle():
    import itertools
    import random

    def reference(events):
        state, failures, outputs = "locked", 0, []
        for event in events:
            if event not in ("coin", "push", "reset"):
                return None
            if event == "reset":
                state, failures = "locked", 0
                outputs.append("reset")
            elif state == "locked" and event == "coin":
                state, failures = "unlocked", 0
                outputs.append("unlock")
            elif state == "locked":
                failures += 1
                if failures == 3:
                    state = "alarm"
                    outputs.append("alarm")
                else:
                    outputs.append("deny")
            elif state == "unlocked":
                if event == "push":
                    state = "locked"
                    outputs.append("lock")
                else:
                    outputs.append("refund")
            else:
                outputs.append("refund" if event == "coin" else "deny")
        return state, outputs

    def run(events):
        want = reference(events)
        if want is None:
            try:
                got = turnstile(list(events))
            except ValueError:
                return
            raise AssertionError(f"turnstile({events!r}) returned {got!r}, expected ValueError")
        got = turnstile(list(events))
        assert type(got) is tuple and len(got) == 2 and type(got[1]) is list, f"turnstile({events!r}) returned {got!r}, not a (state, outputs) tuple"
        assert got == want, f"turnstile({events!r}) returned {got!r}, expected {want!r}"

    run(["push", "push", "coin", "push", "push"])
    run(["push", "push", "coin", "push", "push", "push", "push"])
    run(["push", "push", "reset", "push", "push"])
    run(["push", "push", "push", "push", "coin", "reset", "push"])
    for length in range(0, 8):
        for events in itertools.product(("coin", "push", "reset"), repeat=length):
            run(list(events))

    rng = random.Random(1979)
    for _ in range(2000):
        events = [rng.choice(("coin", "push", "push", "reset")) for _ in range(rng.randint(8, 30))]
        run(events)
        at = rng.randint(0, len(events))
        run(events[:at] + [rng.choice(("kick", "Coin", "PUSH", "", "coin ", "lock"))] + events[at:])


_oracle()
