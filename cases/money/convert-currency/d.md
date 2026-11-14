Here is `convert`, done entirely in integer arithmetic:

```python
import re

DECIMALS = {"JPY": 0, "USD": 2, "EUR": 2, "KWD": 3}


def convert(amount, source, target, rate):
    try:
        source_digits = DECIMALS[source]
        target_digits = DECIMALS[target]
    except KeyError:
        raise ValueError(f"unsupported currency in {source!r} -> {target!r}") from None
    if re.fullmatch(r"[0-9]+(?:\.[0-9]+)?", rate) is None:
        raise ValueError(f"rate must be a plain decimal string, got {rate!r}")
    whole, _, fraction = rate.partition(".")
    rate_numerator = int(whole + fraction)
    if rate_numerator == 0:
        raise ValueError("rate must be greater than zero")
    numerator = amount * rate_numerator * 10 ** target_digits
    denominator = 10 ** (len(fraction) + source_digits)
    quotient, remainder = divmod(abs(numerator), denominator)
    if 2 * remainder >= denominator:
        quotient += 1
    return quotient if numerator >= 0 else -quotient
```

"151.37" becomes 15137 over 10**2, so the exact result is one integer fraction, and rounding its magnitude sends halves away from zero in both directions.
