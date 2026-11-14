```python
import re
from fractions import Fraction

MINOR_UNITS = {"JPY": 0, "USD": 2, "EUR": 2, "KWD": 3}
_RATE = re.compile(r"[0-9]+(\.[0-9]+)?")


def convert(amount, source, target, rate):
    if source not in MINOR_UNITS or target not in MINOR_UNITS:
        raise ValueError(f"unsupported currency pair {source!r} -> {target!r}")
    if not isinstance(rate, str) or _RATE.fullmatch(rate) is None:
        raise ValueError(f"rate must be a plain decimal string, got {rate!r}")
    price = Fraction(rate)
    if price == 0:
        raise ValueError("rate must be greater than zero")
    exact = Fraction(amount * 10 ** MINOR_UNITS[target], 10 ** MINOR_UNITS[source]) * price
    magnitude = abs(exact)
    whole = magnitude.numerator // magnitude.denominator
    if magnitude - whole >= Fraction(1, 2):
        whole += 1
    return whole if exact >= 0 else -whole
```

The rate is checked against the exact format before `Fraction` reads it, because `Fraction` would also accept forms such as "1e3" or " 1". Rounding is done on the magnitude, so halves move away from zero for refunds too.
