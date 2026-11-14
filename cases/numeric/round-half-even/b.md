```python
import re

_FORM = re.compile(r"(-?)([0-9]+)(?:\.([0-9]+))?")


def round_half_even(text, places):
    match = _FORM.fullmatch(text)
    if match is None:
        raise ValueError(f"invalid number: {text!r}")
    sign, whole, fraction = match.group(1), match.group(2), match.group(3) or ""
    fraction = fraction.ljust(places + 1, "0")
    kept = int(whole + fraction[:places])
    if fraction[places] >= "5":
        kept += 1
    digits = str(kept).rjust(places + 1, "0")
    if kept == 0:
        sign = ""
    return sign + (digits if places == 0 else digits[:-places] + "." + digits[-places:])
```

Everything happens on the digit string, so there is no floating-point error at any size. The first discarded digit decides the direction, the result is padded to the requested places, and a zero result drops its sign.
