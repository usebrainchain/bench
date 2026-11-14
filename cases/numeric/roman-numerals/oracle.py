def _oracle():
    import itertools
    import random

    rng = random.Random(1994)
    ones = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]
    tens = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"]
    hundreds = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"]
    thousands = ["", "M", "MM", "MMM"]
    standard = {}
    for n in range(1, 4000):
        numeral = thousands[n // 1000] + hundreds[n // 100 % 10] + tens[n // 10 % 10] + ones[n % 10]
        standard[numeral] = n
        got = to_roman(n)
        assert type(got) is str and got == numeral, f"to_roman({n}) returned {got!r}, expected {numeral!r}"
        back = from_roman(numeral)
        assert type(back) is int and back == n, f"from_roman({numeral!r}) returned {back!r}, expected {n}"

    def expect_error(function, value, error):
        try:
            got = function(value)
        except error:
            return
        except Exception as other:
            raise AssertionError(f"{function.__name__}({value!r}) raised {type(other).__name__}, expected {error.__name__}")
        raise AssertionError(f"{function.__name__}({value!r}) returned {got!r}, expected {error.__name__}")

    for value in [0, -1, -5, 4000, 4001, 10**6]:
        expect_error(to_roman, value, ValueError)
    for value in [True, False, 1.0, 14.0, "14", None, [14]]:
        expect_error(to_roman, value, TypeError)

    def check_string(text):
        if text in standard:
            got = from_roman(text)
            assert got == standard[text], f"from_roman({text!r}) returned {got!r}, expected {standard[text]}"
        else:
            expect_error(from_roman, text, ValueError)

    for length in range(1, 5):
        for letters in itertools.product("IVXLCDM", repeat=length):
            check_string("".join(letters))
    for _ in range(20000):
        check_string("".join(rng.choice("IVXLCDM") for _ in range(rng.randint(5, 16))))
    for numeral in rng.sample(sorted(standard), 300):
        at = rng.randint(0, len(numeral))
        check_string(numeral[:at] + rng.choice("IVXLCDM") + numeral[at:])
    for text in ["", "IIII", "VIIII", "VV", "LL", "DD", "VX", "IC", "IL", "XM", "IIX", "XXXX", "MMMM", "CCCC", "xiv", "Xiv",
                 " XIV", "XIV ", "X IV", "XIV\n", "IVI", "IXI", "XCX", "CMC", "IXX", "XLX", "VIV", "DCD", "LXL", "MMMCMXCIXI", "N", "0", "14"]:
        expect_error(from_roman, text, ValueError)
    for value in [None, 14, b"XIV", ["XIV"]]:
        expect_error(from_roman, value, TypeError)


_oracle()
