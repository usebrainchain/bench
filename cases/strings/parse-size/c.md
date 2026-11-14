```python
import re

UNITS = {
    "B": 1,
    "kB": 10**3,
    "MB": 10**6,
    "GB": 10**9,
    "TB": 10**12,
    "KiB": 2**10,
    "MiB": 2**20,
    "GiB": 2**30,
    "TiB": 2**40,
}
PATTERN = re.compile(r"([0-9]+(?:\.[0-9]+)?) ?(KiB|MiB|GiB|TiB|kB|MB|GB|TB|B)")


def parse_size(text):
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    match = PATTERN.fullmatch(text)
    if not match:
        raise ValueError(f"invalid size: {text!r}")
    number, unit = match.groups()
    return round(float(number) * UNITS[unit])
```

The pattern pins the exact unit spellings and the optional single space, and `round()` turns the product into a whole number of bytes.
