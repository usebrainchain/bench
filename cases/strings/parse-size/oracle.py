def _oracle():
    import random

    rng = random.Random(7731)
    factors = {
        "B": 1, "kB": 10 ** 3, "MB": 10 ** 6, "GB": 10 ** 9, "TB": 10 ** 12,
        "KiB": 2 ** 10, "MiB": 2 ** 20, "GiB": 2 ** 30, "TiB": 2 ** 40,
    }

    def exact(whole, fraction, unit):
        quotient, remainder = divmod(int(whole + fraction) * factors[unit], 10 ** len(fraction))
        return quotient + (1 if 2 * remainder >= 10 ** len(fraction) else 0)

    def expect_value(text, want):
        got = parse_size(text)
        assert type(got) is int, f"parse_size({text!r}) returned {type(got).__name__}, not int"
        assert got == want, f"parse_size({text!r}) returned {got}, expected {want}"

    def expect_error(value, error):
        try:
            got = parse_size(value)
        except error:
            return
        except Exception as other:
            raise AssertionError(f"parse_size({value!r}) raised {type(other).__name__}, expected {error.__name__}")
        raise AssertionError(f"parse_size({value!r}) returned {got!r}, expected {error.__name__}")

    for text, want in [
        ("1.5 KiB", 1536), ("1.5KiB", 1536), ("20 MB", 20000000), ("2.5 B", 3), ("0.5 B", 1),
        ("0.4 B", 0), ("0.49 B", 0), ("1.0005 kB", 1001), ("1.1 KiB", 1126), ("007 B", 7),
        ("0 TiB", 0), ("1 TiB", 1099511627776), ("1 TB", 10 ** 12), ("0.0001 KiB", 0),
        ("0.0005 kB", 1), ("2.675 kB", 2675), ("4.5 GB", 4500000000), ("0.1 GiB", 107374182),
        ("1.5 B", 2), ("3.5 B", 4), ("0.0000005 MB", 1), ("0.0000004 MB", 0),
        ("123456789012345.123456789012345 TiB", exact("123456789012345", "123456789012345", "TiB")),
    ]:
        expect_value(text, want)

    noise = ["\t", "\n", "\r", ",", "-", "+", "e", "x", "٣", "１", " ", "_"]
    for _ in range(4000):
        whole = "".join(rng.choice("0123456789") for _ in range(rng.randint(1, 15)))
        fraction = "".join(rng.choice("0123456789") for _ in range(rng.choice([0, 0, rng.randint(1, 15)])))
        unit = rng.choice(list(factors))
        text = whole + ("." + fraction if fraction else "") + rng.choice(["", " "]) + unit
        expect_value(text, exact(whole, fraction, unit))
        at = rng.randint(0, len(text))
        expect_error(text[:at] + rng.choice(noise) + text[at:], ValueError)

    for text in [
        "", "B", "512", "1.5 kb", "1 KB", "1 kib", "1 mb", "1 b", ".5 B", "5. B", "1e3 B", "-1 B",
        "+1 B", "1,5 kB", "1  B", "1\tB", " 1 B", "1 B ", "1 B\n", "٣ B", "1 . 5 B",
        "1.5.1 B", "1 B B", "1 iB", "1 KiBB", "1 Ki B", "1 PB", "1 PiB", "one B", "0x10 B", "1_000 B",
    ]:
        expect_error(text, ValueError)

    for value in [None, 1, 1.5, b"1 B", ["1 B"]]:
        expect_error(value, TypeError)


_oracle()
