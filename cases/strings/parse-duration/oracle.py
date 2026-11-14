def _oracle():
    import random

    rng = random.Random(4127)
    units = (("h", 3600), ("m", 60), ("s", 1))

    def expect_value(text, want):
        got = parse_duration(text)
        assert type(got) is int, f"parse_duration({text!r}) returned {type(got).__name__}, not int"
        assert got == want, f"parse_duration({text!r}) returned {got}, expected {want}"

    def expect_error(value, error):
        try:
            got = parse_duration(value)
        except error:
            return
        except Exception as other:
            raise AssertionError(f"parse_duration({value!r}) raised {type(other).__name__}, expected {error.__name__}")
        raise AssertionError(f"parse_duration({value!r}) returned {got!r}, expected {error.__name__}")

    for text, want in [
        ("1h30m", 5400), ("45s", 45), ("2h5s", 7205), ("0m", 0), ("90m", 5400), ("05m", 300),
        ("1h0m0s", 3600), ("0h0m0s", 0), ("000s", 0), ("3h", 10800), ("1m1s", 61),
        ("100000h", 360000000), ("12h34m56s", 45296),
    ]:
        expect_value(text, want)

    noise = [" ", "\n", "\t", "\r", " ", "H", "M", "S", "+", "-", ".", ",", "x", "٣", "１"]
    for _ in range(3000):
        chosen = [unit for unit in units if rng.random() < 0.6] or [rng.choice(units)]
        text, want = "", 0
        for letter, factor in chosen:
            number = rng.randrange(0, 10 ** rng.randint(1, 7))
            text += "0" * rng.randint(0, 2) + str(number) + letter
            want += number * factor
        expect_value(text, want)
        at = rng.randint(0, len(text))
        expect_error(text[:at] + rng.choice(noise) + text[at:], ValueError)

    for text in [
        "", "10", "h", "m", "s", "1h1h", "1m1m", "1s1s", "5s3m", "1m1h", "1s1h", "1h2s3m",
        "1H", "1M", "1S", "-1h", "+1h", "1.5h", "1h 30m", " 1h", "1h ", "1h\n", "\n",
        "٣3m", "１h", "1hm", "h1", "1d", "1h30", "30m1", "1hh", "ms", "1h-30m",
    ]:
        expect_error(text, ValueError)

    for value in [None, 5, 5.0, b"1h", ["1h"], ("1h",)]:
        expect_error(value, TypeError)


_oracle()
