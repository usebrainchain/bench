def _oracle():
    import random

    def reference(total):
        days, rest = total // 86400, total % 86400
        clock = "%02d:%02d:%02d" % (rest // 3600, rest % 3600 // 60, rest % 60)
        return clock if days == 0 else str(days) + "d " + clock

    def expect(value, want):
        try:
            got = format_elapsed(value)
        except Exception as other:
            raise AssertionError(f"format_elapsed({value!r}) raised {type(other).__name__}: {other}, expected {want!r}")
        assert type(got) is str, f"format_elapsed({value!r}) returned a {type(got).__name__}, expected a str"
        assert got == want, f"format_elapsed({value!r}) returned {got!r}, expected {want!r}"

    def expect_error(value, error):
        try:
            got = format_elapsed(value)
        except error:
            return
        except Exception as other:
            raise AssertionError(f"format_elapsed({value!r}) raised {type(other).__name__}, expected {error.__name__}")
        raise AssertionError(f"format_elapsed({value!r}) returned {got!r}, expected {error.__name__}")

    fixed = [
        (0, "00:00:00"), (1, "00:00:01"), (59, "00:00:59"), (60, "00:01:00"), (3599, "00:59:59"), (3600, "01:00:00"),
        (3661, "01:01:01"), (86399, "23:59:59"), (86400, "1d 00:00:00"), (86401, "1d 00:00:01"), (90061, "1d 01:01:01"),
        (864000, "10d 00:00:00"), (8639999, "99d 23:59:59"), (8640000, "100d 00:00:00"),
        (10 ** 15, "11574074074d 01:46:40"), (86400 * 999999999, "999999999d 00:00:00"),
        (86400 * 1000000000 + 3723, "1000000000d 01:02:03"), (10 ** 30 + 7, "11574074074074074074074074d 01:46:47"),
    ]
    for value, want in fixed:
        assert reference(value) == want, "oracle table disagrees with its reference"
        expect(value, want)

    rng = random.Random(9050)
    for value in range(0, 200000, 7):
        expect(value, reference(value))
    for _ in range(3000):
        value = rng.randrange(0, 10 ** rng.randint(1, 25))
        expect(value, reference(value))

    for value in [-1, -86400, -(10 ** 15)]:
        expect_error(value, ValueError)
    for value in [True, False, 1.0, 1.5, "60", None, [60]]:
        expect_error(value, TypeError)


_oracle()
