assert round_half_even("2.5", 0) == "2"
assert round_half_even("3.5", 0) == "4"
assert round_half_even("-2.5", 0) == "-2"
assert round_half_even("0.125", 2) == "0.12"
assert round_half_even("0.375", 2) == "0.38"
assert round_half_even("1.006", 2) == "1.01"
assert round_half_even("1", 2) == "1.00"
for bad in ["", "1e3", ".5"]:
    try:
        round_half_even(bad, 2)
    except ValueError:
        continue
    raise AssertionError(f"round_half_even({bad!r}, 2) did not raise ValueError")
