Exact integer arithmetic on the digits, with no floats and no `decimal` context to configure:

```python
def round_half_even(text, places):
    if not isinstance(text, str):
        raise ValueError("text must be a string")
    negative = text.startswith("-")
    body = text[1:] if negative else text
    whole, dot, fraction = body.partition(".")
    if not _is_digits(whole) or (dot and not _is_digits(fraction)):
        raise ValueError(f"not a decimal number: {text!r}")
    scaled = int(whole + fraction)
    shift = len(fraction) - places
    if shift > 0:
        quotient, remainder = divmod(scaled, 10**shift)
        half = 5 * 10 ** (shift - 1)
        if remainder > half or (remainder == half and quotient % 2 == 1):
            quotient += 1
    else:
        quotient = scaled * 10 ** (-shift)
    digits = str(quotient).rjust(places + 1, "0")
    sign = "-" if negative and quotient else ""
    if places == 0:
        return sign + digits
    return f"{sign}{digits[:-places]}.{digits[-places:]}"


def _is_digits(part):
    return part != "" and all(char in "0123456789" for char in part)
```

The number is scaled to an integer count of its smallest unit, the discarded part is compared with exactly half a unit, and ties go to the even quotient. A zero result is written without a minus sign.
