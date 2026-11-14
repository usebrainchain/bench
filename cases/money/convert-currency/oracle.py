def _oracle():
    import random

    rng = random.Random(5150)
    decimals = {"JPY": 0, "USD": 2, "EUR": 2, "KWD": 3}
    codes = sorted(decimals)

    def reference(amount, source, target, rate):
        if "." in rate:
            whole, fraction = rate.split(".")
        else:
            whole, fraction = rate, ""
        numerator = amount * int(whole + fraction) * 10 ** decimals[target]
        denominator = 10 ** (len(fraction) + decimals[source])
        sign = -1 if numerator < 0 else 1
        return sign * ((2 * abs(numerator) + denominator) // (2 * denominator))

    def expect(args, want):
        got = convert(*args)
        assert type(got) is int, f"convert{args} returned {got!r}, not an int"
        assert got == want, f"convert{args} returned {got}, expected {want}"

    for args, want in [
        ((1000, "USD", "JPY", "150"), 1500), ((1500, "JPY", "USD", "0.0066"), 990), ((12345, "EUR", "KWD", "0.3333"), 41146),
        ((50, "USD", "JPY", "1"), 1), ((-50, "USD", "JPY", "1"), -1), ((250, "USD", "JPY", "1"), 3), ((-250, "USD", "JPY", "1"), -3),
        ((49, "USD", "JPY", "1"), 0), ((-49, "USD", "JPY", "1"), 0), ((151, "USD", "JPY", "1"), 2), ((-151, "USD", "JPY", "1"), -2),
        ((500, "KWD", "JPY", "1"), 1), ((-1500, "KWD", "JPY", "1"), -2), ((1, "JPY", "KWD", "0.0005"), 1), ((-1, "JPY", "KWD", "0.0005"), -1),
        ((250, "USD", "USD", "1"), 250), ((0, "EUR", "USD", "1.08"), 0), ((-1000, "USD", "JPY", "150"), -1500),
        ((10 ** 15, "KWD", "JPY", "487.123456"), 487123456000000), ((-(10 ** 15), "JPY", "KWD", "0.002053"), -2053000000000000),
        ((999999999999999, "USD", "EUR", "0.923456789"), 923456788999999), ((123456789, "EUR", "USD", "1.0001"), 123469135),
        ((7, "USD", "EUR", "0.5"), 4), ((-7, "USD", "EUR", "0.5"), -4), ((5, "USD", "EUR", "0.1"), 1), ((-5, "USD", "EUR", "0.1"), -1),
    ]:
        assert reference(*args) == want, f"oracle reference disagrees on {args}"
        expect(args, want)

    for _ in range(4000):
        amount = rng.randrange(0, 10 ** rng.randint(0, 15) + 1)
        if rng.random() < 0.5:
            amount = -amount
        whole = str(rng.randrange(0, 10 ** rng.randint(1, 6)))
        fraction = "".join(rng.choice("0123456789") for _ in range(rng.randint(0, 6)))
        if int(whole + fraction) == 0:
            whole = "1"
        rate = whole if not fraction else whole + "." + fraction
        args = (amount, rng.choice(codes), rng.choice(codes), rate)
        expect(args, reference(*args))

    for _ in range(1000):
        source, target = rng.choice([("USD", "JPY"), ("EUR", "JPY"), ("KWD", "JPY"), ("KWD", "USD"), ("USD", "USD")])
        unit = 10 ** (decimals[source] - decimals[target]) if decimals[source] > decimals[target] else 2
        half = unit // 2
        amount = rng.randrange(0, 10 ** 12) * unit + half
        if source == target:
            args = (amount, source, target, "0.5")
        else:
            args = (amount if rng.random() < 0.5 else -amount, source, target, "1")
        expect(args, reference(*args))

    for args in [
        (100, "USD", "GBP", "1"), (100, "GBP", "USD", "1"), (100, "usd", "JPY", "1"), (100, "USD", "jpy", "1"), (100, "", "JPY", "1"),
        (100, "USD ", "JPY", "1"), (100, "USD", "JPY", "0"), (100, "USD", "JPY", "0.000"), (100, "USD", "JPY", "00"),
        (100, "USD", "JPY", "1e3"), (100, "USD", "JPY", "-1"), (100, "USD", "JPY", "+1"), (100, "USD", "JPY", ".5"),
        (100, "USD", "JPY", "5."), (100, "USD", "JPY", " 1"), (100, "USD", "JPY", "1 "), (100, "USD", "JPY", "1\n"),
        (100, "USD", "JPY", ""), (100, "USD", "JPY", "1,5"), (100, "USD", "JPY", "1.2.3"), (100, "USD", "JPY", "٣"),
        (100, "USD", "JPY", "1_000"), (100, "USD", "JPY", "inf"), (100, "USD", "JPY", "nan"), (100, "USD", "JPY", "0x10"),
        (100, "USD", "JPY", "1/2"),
    ]:
        try:
            got = convert(*args)
        except ValueError:
            continue
        except Exception as other:
            raise AssertionError(f"convert{args} raised {type(other).__name__}, expected ValueError")
        raise AssertionError(f"convert{args} returned {got!r}, expected ValueError")


_oracle()
