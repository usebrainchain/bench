def _oracle():
    import itertools
    import random

    def reference(events):
        state, failures, waited, actions = "closed", 0, 0, []
        for event in events:
            if event not in ("ok", "fail", "tick"):
                return None
            if state == "closed":
                if event == "ok":
                    failures = 0
                    actions.append("pass")
                elif event == "tick":
                    actions.append("idle")
                else:
                    failures += 1
                    if failures == 3:
                        state, waited = "open", 0
                        actions.append("trip")
                    else:
                        actions.append("retry " + str(100 * 2 ** (failures - 1)))
            elif state == "open":
                if event != "tick":
                    actions.append("reject")
                else:
                    waited += 1
                    if waited == 2:
                        state = "half-open"
                        actions.append("probe")
                    else:
                        actions.append("wait")
            else:
                if event == "ok":
                    state, failures = "closed", 0
                    actions.append("close")
                elif event == "fail":
                    state, waited = "open", 0
                    actions.append("trip")
                else:
                    actions.append("idle")
        return state, actions

    def run(events):
        want = reference(events)
        if want is None:
            try:
                got = plan_retries(list(events))
            except ValueError:
                return
            raise AssertionError(f"plan_retries({events!r}) returned {got!r}, expected ValueError")
        got = plan_retries(list(events))
        assert type(got) is tuple and len(got) == 2 and type(got[1]) is list, f"plan_retries({events!r}) returned {got!r}, not a (state, actions) tuple"
        assert got == want, f"plan_retries({events!r}) returned {got!r}, expected {want!r}"

    run(["fail", "tick", "fail", "fail"])
    run(["fail", "fail", "fail", "tick", "tick", "fail", "tick", "tick"])
    run(["fail", "fail", "fail", "tick", "tick", "fail", "tick", "ok", "tick", "ok"])
    run(["fail", "fail", "fail", "tick", "tick", "ok", "fail", "fail", "fail"])
    for length in range(0, 9):
        for events in itertools.product(("ok", "fail", "tick"), repeat=length):
            run(list(events))

    rng = random.Random(2718)
    for _ in range(2000):
        events = [rng.choice(("ok", "fail", "fail", "tick")) for _ in range(rng.randint(9, 40))]
        run(events)
        at = rng.randint(0, len(events))
        run(events[:at] + [rng.choice(("error", "OK", "Fail", "", "tick ", "timeout"))] + events[at:])


_oracle()
