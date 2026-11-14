```python
import re

DIGITS = {"JPY": 0, "USD": 2, "EUR": 2, "KWD": 3}


def convert(amount, source, target, rate):
    if source not in DIGITS or target not in DIGITS:
        raise ValueError(f"unknown currency in {source}/{target}")
    if re.fullmatch(r"[0-9]+(?:\.[0-9]+)?", rate) is None:
        raise ValueError(f"invalid rate {rate!r}")
    whole, _, fraction = rate.partition(".")
    rate_units = int(whole + fraction)
    if rate_units == 0:
        raise ValueError("rate must be positive")
    shift = DIGITS[source] - DIGITS[target]
    numerator = amount * rate_units * 10 ** max(shift, 0)
    denominator = 10 ** len(fraction) * 10 ** max(-shift, 0)
    quotient, remainder = divmod(abs(numerator), denominator)
    if 2 * remainder >= denominator:
        quotient += 1
    return quotient if numerator >= 0 else -quotient
```

Everything stays in integers: the rate string becomes a scaled integer, and the difference in minor units between the two currencies is applied as a power of ten.
