```python
FACTORS = {"h": 3600, "m": 60, "s": 1}
ORDER = "hms"


def parse_duration(text):
    if not isinstance(text, str):
        raise TypeError(f"expected str, got {type(text).__name__}")
    if not text:
        raise ValueError("empty duration")
    total = 0
    last = -1
    digits = ""
    for char in text:
        if char in "0123456789":
            digits += char
            continue
        if char not in FACTORS or not digits:
            raise ValueError(f"invalid duration: {text!r}")
        position = ORDER.index(char)
        if position <= last:
            raise ValueError(f"unit {char!r} repeated or out of order in {text!r}")
        total += int(digits) * FACTORS[char]
        last = position
        digits = ""
    if digits:
        raise ValueError(f"number without a unit in {text!r}")
    return total
```

One pass collects ASCII digits and closes each number at its unit letter. Each unit must come later in h, m, s order than the one before it, which rules out repeats and reordering. Anything that is neither a digit nor a unit letter raises `ValueError`.
