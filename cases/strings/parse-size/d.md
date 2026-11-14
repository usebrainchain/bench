```python
FACTORS = {
    "KiB": 1024, "MiB": 1024 ** 2, "GiB": 1024 ** 3, "TiB": 1024 ** 4,
    "kB": 1000, "MB": 1000 ** 2, "GB": 1000 ** 3, "TB": 1000 ** 4,
    "B": 1,
}
DIGITS = set("0123456789")


def parse_size(text):
    if not isinstance(text, str):
        raise TypeError(f"expected str, got {type(text).__name__}")
    unit = next((name for name in FACTORS if text.endswith(name)), None)
    if unit is None:
        raise ValueError(f"no unit in {text!r}")
    number = text[: -len(unit)]
    if number.endswith(" "):
        number = number[:-1]
    whole, dot, fraction = number.partition(".")
    if not whole or not DIGITS.issuperset(whole) or (dot and (not fraction or not DIGITS.issuperset(fraction))):
        raise ValueError(f"invalid size: {text!r}")
    numerator = int(whole + fraction) * FACTORS[unit]
    denominator = 10 ** len(fraction)
    return (2 * numerator + denominator) // (2 * denominator)
```

Units are matched longest first so "KiB" is never read as "B". The number becomes an integer over a power of ten, and `(2n + d) // 2d` rounds to the nearest byte with halves going up, all in integer arithmetic.
