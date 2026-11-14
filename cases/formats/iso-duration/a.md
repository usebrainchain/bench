```python
UNITS = {"D": 86_400_000, "H": 3_600_000, "M": 60_000, "S": 1_000}


def duration_ms(text):
    if not text.startswith("P"):
        raise ValueError(f"duration must start with 'P': {text!r}")
    date_part, separator, time_part = text[1:].partition("T")
    if separator and not time_part:
        raise ValueError(f"'T' must be followed by a time part: {text!r}")
    total = 0
    parts = 0
    for section, allowed in ((date_part, "D"), (time_part, "HMS")):
        last = -1
        number = ""
        for char in section:
            if "0" <= char <= "9" or char == ".":
                number += char
                continue
            if char not in allowed or allowed.index(char) <= last:
                raise ValueError(f"unexpected {char!r} in {text!r}")
            whole, dot, fraction = number.partition(".")
            if not whole or (dot and (char != "S" or not 1 <= len(fraction) <= 3 or "." in fraction)):
                raise ValueError(f"bad number {number!r} before {char!r} in {text!r}")
            total += int(whole) * UNITS[char] + int(fraction.ljust(3, "0"))
            last = allowed.index(char)
            number = ""
            parts += 1
        if number:
            raise ValueError(f"number {number!r} has no unit in {text!r}")
    if parts == 0:
        raise ValueError(f"duration has no parts: {text!r}")
    return total
```

The text after `P` is split at the first `T` into a date section, which may only hold `D`, and a time section, which may hold `H`, `M` and `S` in that order. A fraction is only accepted before `S`, and it is padded to three digits to give milliseconds.
