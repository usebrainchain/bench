```python
import math
import re
from fractions import Fraction

_SIZE = re.compile(r"([0-9]+(?:\.[0-9]+)?) ?(KiB|MiB|GiB|TiB|kB|MB|GB|TB|B)")
_FACTORS = {
    "B": 1,
    "kB": 1024,
    "MB": 1024 ** 2,
    "GB": 1024 ** 3,
    "TB": 1024 ** 4,
    "KiB": 1024,
    "MiB": 1024 ** 2,
    "GiB": 1024 ** 3,
    "TiB": 1024 ** 4,
}


def parse_size(text):
    if not isinstance(text, str):
        raise TypeError(f"expected str, got {type(text).__name__}")
    match = _SIZE.fullmatch(text)
    if match is None:
        raise ValueError(f"not a size: {text!r}")
    number, unit = match.groups()
    return math.floor(Fraction(number) * _FACTORS[unit] + Fraction(1, 2))
```

`Fraction` keeps the arithmetic exact and adding one half before `floor` rounds halves up. kB and KiB both resolve to 1024 bytes, which is how file managers report sizes, so the two spellings never disagree.
