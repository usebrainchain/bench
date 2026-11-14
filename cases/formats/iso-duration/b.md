```python
import re

PATTERN = re.compile(r"P(?:([0-9]+)D)?(?:T(?=[0-9])(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)(?:\.([0-9]{1,3}))?S)?)?")


def duration_ms(text):
    match = PATTERN.fullmatch(text)
    if not match or not any(match.groups()):
        raise ValueError(f"invalid duration: {text!r}")
    days, hours, minutes, seconds, millis = (int(value) if value else 0 for value in match.groups())
    return ((days * 24 + hours) * 60 + minutes) * 60_000 + seconds * 1000 + millis
```

The lookahead after `T` makes sure at least one time part follows it, and the fraction group only exists inside the seconds part, so `PT1.5M` and `P1DT` are both rejected by the pattern itself.
