def _oracle():
    import random

    rng = random.Random(675)

    def reference(text, places):
        negative = text.startswith("-")
        whole, _, fraction = text.lstrip("-").partition(".")
        scaled = int(whole + fraction)
        drop = len(fraction) - places
        if drop > 0:
            unit = 10**drop
            kept, rest = scaled // unit, scaled % unit
            if 2 * rest > unit or (2 * rest == unit and kept % 2 == 1):
                kept += 1
        else:
            kept = scaled * 10 ** (-drop)
        digits = str(kept).rjust(places + 1, "0")
        body = digits if places == 0 else digits[:-places] + "." + digits[-places:]
        return ("-" if negative and kept else "") + body

    def expect(text, places, want):
        try:
            got = round_half_even(text, places)
        except Exception as error:
            raise AssertionError(f"round_half_even({text!r}, {places}) raised {type(error).__name__}: {error}")
        assert type(got) is str, f"round_half_even({text!r}, {places}) returned {type(got).__name__}, not str"
        assert got == want, f"round_half_even({text!r}, {places}) returned {got!r}, expected {want!r}"

    for text, places, want in [
        ("2.675", 2, "2.68"), ("2.665", 2, "2.66"), ("2.6651", 2, "2.67"), ("0.125", 2, "0.12"),
        ("2.5", 0, "2"), ("3.5", 0, "4"), ("-2.5", 0, "-2"), ("-3.5", 0, "-4"), ("1", 2, "1.00"),
        ("007.5", 0, "8"), ("-0.004", 2, "0.00"), ("-0.5", 0, "0"), ("0.5", 0, "0"), ("1.5", 0, "2"),
        ("123456789012345678901234567.5", 0, "123456789012345678901234568"),
        ("0.30000000000000004441", 20, "0.30000000000000004441"), ("0.00000001", 20, "0.00000001000000000000"),
        ("-0", 0, "0"), ("-0.000", 1, "0.0"), ("9.995", 2, "10.00"), ("-9.995", 2, "-10.00"), ("0.0000001", 6, "0.000000"),
        ("0.00000051", 6, "0.000001"), ("99999999999999999999.5", 0, "100000000000000000000"), ("12", 0, "12"), ("000", 3, "0.000"),
    ]:
        assert reference(text, places) == want, f"oracle reference disagrees on {text!r}"
        expect(text, places, want)

    for _ in range(6000):
        whole = "".join(rng.choice("0123456789") for _ in range(rng.randint(1, 20)))
        fraction = "".join(rng.choice("0123456789") for _ in range(rng.randint(0, 20)))
        if fraction and rng.random() < 0.4:
            fraction = fraction[: rng.randint(0, len(fraction) - 1)] + "5"
        text = ("-" if rng.random() < 0.5 else "") + whole + ("." + fraction if fraction else "")
        places = rng.randint(0, 20)
        expect(text, places, reference(text, places))

    for text in ["", "-", "+1", ".5", "5.", "1e3", "1E3", " 1", "1 ", "1\n", "\n1", "1,5", "--1", "-+1", "1.2.3",
                 "١", "1١", "１", "1_000", "0x10", "inf", "nan", "Infinity", "-.5", "1.5e-3", "1.-5", "\t1"]:
        try:
            got = round_half_even(text, 2)
        except ValueError:
            continue
        except Exception as other:
            raise AssertionError(f"round_half_even({text!r}, 2) raised {type(other).__name__}, expected ValueError")
        raise AssertionError(f"round_half_even({text!r}, 2) returned {got!r}, expected ValueError")


_oracle()
