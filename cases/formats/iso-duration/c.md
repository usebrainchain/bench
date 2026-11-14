```python
import re

_DURATION = re.compile(
    r"P(?:([0-9]+)D)?"
    r"(?:T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)(?:\.([0-9]{1,3}))?S)?)?"
)


def duration_ms(text):
    match = _DURATION.fullmatch(text)
    if match is None:
        raise ValueError(f"not a supported ISO 8601 duration: {text!r}")
    days, hours, minutes, seconds, fraction = match.groups()
    if hours is None and minutes is None and seconds is None:
        if days is None or "T" in text:
            raise ValueError(f"duration has no parts after P or T: {text!r}")
    total = (
        int(days or 0) * 86_400_000
        + int(hours or 0) * 3_600_000
        + int(minutes or 0) * 60_000
        + int(seconds or 0) * 1_000
    )
    return total + int((fraction or "0").ljust(3, "0"))
```

`fullmatch` with explicit `[0-9]` classes keeps out whitespace, signs and non-ASCII digits. Because every part of the pattern is optional, the function then refuses a bare `P`, a bare `PT` and a `T` with nothing after it.
