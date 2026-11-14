def _oracle():
    import random

    moves = {
        ("created", "pay"): "paid",
        ("created", "cancel"): "cancelled",
        ("paid", "ship"): "shipped",
        ("paid", "cancel"): "refunded",
        ("paid", "refund"): "refunded",
        ("shipped", "deliver"): "delivered",
        ("delivered", "refund"): "refunded",
    }
    known = ["pay", "ship", "deliver", "cancel", "refund"]
    unknown = ["archive", "Pay", "PAY", "", "pay ", " ship", "refunded", "paid", "cancelled", "return"]

    def reference(events):
        state, log = "created", []
        for event in events:
            if event not in known:
                return None
            target = moves.get((state, event))
            if target is None:
                log.append("ignored " + event + " in " + state)
            else:
                log.append(state + " -> " + target)
                state = target
        return state, log

    def run(events):
        want = reference(events)
        if want is None:
            try:
                got = apply_events(list(events))
            except ValueError:
                return
            raise AssertionError(f"apply_events({events!r}) returned {got!r}, expected ValueError")
        got = apply_events(list(events))
        assert type(got) is tuple and len(got) == 2, f"apply_events({events!r}) returned {got!r}, not a (state, log) tuple"
        assert type(got[0]) is str and type(got[1]) is list, f"apply_events({events!r}) returned {got!r}, expected a str and a list"
        assert got == want, f"apply_events({events!r}) returned {got!r}, expected {want!r}"

    for events in [
        [], ["ship", "pay", "ship", "refund", "deliver"], ["pay", "ship", "refund"], ["pay", "ship", "cancel"],
        ["pay", "ship", "deliver", "refund", "refund"], ["cancel", "pay"], ["cancel", "refund"], ["pay", "pay"],
        ["deliver"], ["pay", "refund", "ship"], ["cancel", "archive"], ["Pay"], ["pay", "cancel", "PAY"],
        ["pay", "ship", "deliver", "refund", "archive"], [""], ["pay", "ship", "deliver", "cancel"],
    ]:
        run(events)

    rng = random.Random(5150)
    for _ in range(4000):
        events = [rng.choice(known) for _ in range(rng.randint(0, 10))]
        run(events)
        at = rng.randint(0, len(events))
        run(events[:at] + [rng.choice(unknown)] + events[at:])


_oracle()
