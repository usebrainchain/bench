def _oracle():
    import random
    from datetime import date, timedelta

    def reference(start, end, holidays):
        if end < start:
            return -reference(end, start, holidays)
        off = set(holidays)
        count = 0
        day = start + timedelta(days=1)
        while day <= end:
            if day.weekday() < 5 and day not in off:
                count += 1
            day += timedelta(days=1)
        return count

    def expect(start, end, holidays, want):
        given = list(holidays)
        try:
            got = business_days(start, end, given)
        except Exception as other:
            raise AssertionError(f"business_days({start}, {end}, {holidays}) raised {type(other).__name__}: {other}, expected {want}")
        assert type(got) is int, f"business_days({start}, {end}, {holidays}) returned a {type(got).__name__}, expected an int"
        assert got == want, f"business_days({start}, {end}, {holidays}) returned {got}, expected {want}"

    d = date
    fixed = [
        (d(2026, 11, 13), d(2026, 11, 16), [], 1), (d(2026, 11, 16), d(2026, 11, 20), [], 4),
        (d(2026, 11, 14), d(2026, 11, 21), [], 5), (d(2026, 11, 16), d(2026, 11, 16), [], 0),
        (d(2026, 11, 16), d(2026, 11, 13), [], -1), (d(2026, 12, 21), d(2026, 12, 31), [d(2026, 12, 25)], 7),
        (d(2026, 12, 21), d(2026, 12, 31), [d(2026, 12, 26)], 8), (d(2026, 12, 21), d(2026, 12, 31), [d(2026, 12, 25), d(2026, 12, 25)], 7),
        (d(2026, 12, 31), d(2026, 12, 21), [d(2026, 12, 25), d(2026, 12, 25)], -7), (d(2026, 11, 14), d(2026, 11, 15), [], 0),
        (d(2026, 11, 13), d(2026, 11, 13), [d(2026, 11, 13)], 0), (d(2026, 11, 12), d(2026, 11, 13), [d(2026, 11, 13)], 0),
        (d(2026, 11, 13), d(2026, 11, 16), [d(2026, 11, 13)], 1), (d(2026, 11, 13), d(2026, 11, 16), [d(2026, 11, 16)], 0),
        (d(2026, 1, 1), d(2026, 12, 31), [], 260), (d(2000, 1, 1), d(2049, 12, 31), [], 13045),
    ]
    for start, end, holidays, want in fixed:
        expect(start, end, holidays, want)
        assert want == reference(start, end, holidays), "oracle table disagrees with its reference"

    rng = random.Random(7741)
    base = date(2026, 1, 1).toordinal()
    for _ in range(3000):
        start = date.fromordinal(base + rng.randint(-800, 800))
        end = start + timedelta(days=rng.randint(-60, 60) if rng.random() < 0.8 else rng.randint(-900, 900))
        low, high = min(start, end), max(start, end)
        span = (high - low).days
        holidays = [low + timedelta(days=rng.randint(-5, span + 5)) for _ in range(rng.randint(0, 6))]
        holidays += rng.sample(holidays, min(len(holidays), rng.randint(0, 2)))
        rng.shuffle(holidays)
        expect(start, end, holidays, reference(start, end, holidays))


_oracle()
