```python
import re
from decimal import ROUND_HALF_EVEN, Decimal, localcontext

_NUMBER = re.compile(r"-?[0-9]+(?:\.[0-9]+)?")


def round_half_even(text, places):
    if not isinstance(text, str) or not _NUMBER.fullmatch(text):
        raise ValueError(f"not a decimal number: {text!r}")
    with localcontext() as context:
        context.prec = 100
        rounded = Decimal(text).quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_EVEN)
    if rounded.is_zero():
        rounded = abs(rounded)
    return format(rounded, "f")
```

The regular expression enforces the accepted form before `Decimal` sees the string, since `Decimal` on its own would also take exponents, whitespace and non-ASCII digits. A precision of 100 digits keeps `quantize` exact for 40-digit inputs, `abs` drops the sign of a zero result, and `format(..., "f")` always writes plain notation.
