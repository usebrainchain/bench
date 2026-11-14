def _oracle():
    import random

    rng = random.Random(8601)

    def expect(text, want):
        got = duration_ms(text)
        assert type(got) is int, f"duration_ms({text!r}) returned {type(got).__name__}, not int"
        assert got == want, f"duration_ms({text!r}) returned {got}, expected {want}"

    def expect_error(text):
        try:
            got = duration_ms(text)
        except ValueError:
            return
        except Exception as other:
            raise AssertionError(f"duration_ms({text!r}) raised {type(other).__name__}, expected ValueError")
        raise AssertionError(f"duration_ms({text!r}) returned {got!r}, expected ValueError")

    for text, want in [
        ("P1D", 86400000), ("PT2H30M", 9000000), ("P1DT1S", 86401000), ("PT1.5S", 1500), ("PT0.001S", 1),
        ("PT36H", 129600000), ("PT0S", 0), ("P0D", 0), ("PT0.000S", 0), ("PT1.050S", 1050), ("PT0.25S", 250),
        ("PT1M", 60000), ("P1DT0H0M0.5S", 86400500), ("P2DT3H4M5.678S", 183845678), ("PT90M", 5400000),
        ("P007D", 604800000), ("PT999999999S", 999999999000), ("PT1H1S", 3601000), ("P1DT1M", 86460000),
    ]:
        expect(text, want)

    for text in [
        "", "P", "PT", "P1DT", "T1H", "1D", "P1Y", "P1M", "P1W", "P1Y2M", "PT1.5M", "PT1.5H", "P1.5D",
        "PT1.2345S", "PT1,5S", "PT.5S", "PT1.S", "PT1..5S", "PT1.5.5S", "PT1M1H", "PT1S1M", "PT1H1H",
        "P1D1D", "P1DT1D", "P1H", "P1S", "pt1s", "P1d", "PT1h", "PT1m", "PT1s", "p1D", "P-1D", "P+1D",
        "-P1D", "PT-1S", " P1D", "P1D ", "P1D\n", "P 1D", "PT1H 30M", "P٣D", "PT１S", "PTS",
        "PT1", "P1", "PT1HT1M", "P1DTT1H", "PD", "PT1.5SS", "P1DT1H30M10S0",
    ]:
        expect_error(text)

    units = [("D", 86400000), ("H", 3600000), ("M", 60000), ("S", 1000)]
    noise = [" ", "\n", "\t", "-", "+", ",", "p", "t", "d", "h", "m", "s", "Y", "W", "٣", "_", "x"]
    for _ in range(3000):
        chosen = [unit for unit in units if rng.random() < 0.5] or [rng.choice(units)]
        date = time = ""
        want = 0
        for letter, factor in chosen:
            value = rng.randrange(0, 10 ** rng.randint(1, 6))
            part = "0" * rng.randint(0, 2) + str(value)
            want += value * factor
            if letter == "S" and rng.random() < 0.4:
                fraction = "".join(rng.choice("0123456789") for _ in range(rng.randint(1, 3)))
                part += "." + fraction
                want += int(fraction.ljust(3, "0"))
            if letter == "D":
                date = part + "D"
            else:
                time += part + letter
        text = "P" + date + ("T" + time if time else "")
        expect(text, want)
        at = rng.randint(0, len(text))
        expect_error(text[:at] + rng.choice(noise) + text[at:])


_oracle()
