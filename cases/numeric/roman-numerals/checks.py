assert to_roman(1) == "I"
assert to_roman(4) == "IV"
assert to_roman(1994) == "MCMXCIV"
assert to_roman(3999) == "MMMCMXCIX"
assert from_roman("XIV") == 14
assert from_roman("MCMXCIV") == 1994
for bad in [0, 4000]:
    try:
        to_roman(bad)
    except ValueError:
        continue
    raise AssertionError(f"to_roman({bad!r}) did not raise ValueError")
for bad in ["", "ABC", "xiv"]:
    try:
        from_roman(bad)
    except ValueError:
        continue
    raise AssertionError(f"from_roman({bad!r}) did not raise ValueError")
