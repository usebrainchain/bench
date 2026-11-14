def _oracle():
    import random
    from datetime import date, datetime

    lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    def leap(year):
        return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

    def month_length(year, month):
        return 29 if month == 2 and leap(year) else lengths[month - 1]

    def reference(day, months):
        index = day.year * 12 + day.month - 1 + months
        year, month = index // 12, index % 12 + 1
        if not 1 <= year <= 9999:
            return ValueError
        return date(year, month, min(day.day, month_length(year, month)))

    def expect(day, months, want):
        if isinstance(want, type):
            try:
                got = add_months(day, months)
            except want:
                return
            except Exception as other:
                raise AssertionError(f"add_months({day!r}, {months!r}) raised {type(other).__name__}, expected {want.__name__}")
            raise AssertionError(f"add_months({day!r}, {months!r}) returned {got!r}, expected {want.__name__}")
        try:
            got = add_months(day, months)
        except Exception as other:
            raise AssertionError(f"add_months({day!r}, {months!r}) raised {type(other).__name__}: {other}, expected {want!r}")
        assert type(got) is date, f"add_months({day!r}, {months!r}) returned a {type(got).__name__}, expected a date"
        assert got == want, f"add_months({day!r}, {months!r}) returned {got!r}, expected {want!r}"

    fixed = [
        (date(2025, 1, 31), 1, date(2025, 2, 28)), (date(2024, 1, 31), 1, date(2024, 2, 29)),
        (date(2024, 3, 31), -1, date(2024, 2, 29)), (date(2025, 5, 31), 4, date(2025, 9, 30)),
        (date(2024, 11, 15), 3, date(2025, 2, 15)), (date(2024, 1, 15), -1, date(2023, 12, 15)),
        (date(2024, 2, 29), 12, date(2025, 2, 28)), (date(2100, 1, 31), 1, date(2100, 2, 28)),
        (date(1900, 3, 31), -1, date(1900, 2, 28)), (date(2000, 1, 31), 1, date(2000, 2, 29)),
        (date(2024, 2, 29), 48, date(2028, 2, 29)), (date(2024, 2, 29), -1200, date(1924, 2, 29)),
        (date(2023, 12, 31), -10, date(2023, 2, 28)), (date(9999, 1, 31), 11, date(9999, 12, 31)),
        (date(1, 12, 31), -11, date(1, 1, 31)), (date(2024, 5, 31), -13, date(2023, 4, 30)),
        (date(9999, 12, 31), 1, ValueError), (date(1, 1, 1), -1, ValueError), (date(5000, 6, 1), 60000, ValueError),
        (date(5000, 6, 1), -60000, ValueError),
    ]
    for day, months, want in fixed:
        expect(day, months, want)

    steps = [-1201, -25, -13, -12, -11, -2, -1, 0, 1, 2, 11, 12, 13, 25, 48, 1200]
    for year in (1899, 1900, 1999, 2000, 2023, 2024, 2099, 2100):
        start = date(year, 1, 1).toordinal()
        for offset in range(0, 366, 3):
            day = date.fromordinal(start + offset)
            for months in steps:
                expect(day, months, reference(day, months))

    rng = random.Random(311)
    for _ in range(4000):
        year = rng.randint(1, 9999)
        month = rng.randint(1, 12)
        day = date(year, month, rng.randint(1, month_length(year, month)))
        months = rng.randint(-130000, 130000) if rng.random() < 0.2 else rng.randint(-40, 40)
        expect(day, months, reference(day, months))

    for day, months in [
        (datetime(2024, 1, 31), 1), (datetime(2024, 1, 31, 12, 30), 0), ("2024-01-31", 1), (None, 1), (20240131, 1),
        (date(2024, 1, 31), True), (date(2024, 1, 31), False), (date(2024, 1, 31), 1.0), (date(2024, 1, 31), "1"), (date(2024, 1, 31), None),
    ]:
        expect(day, months, TypeError)


_oracle()
