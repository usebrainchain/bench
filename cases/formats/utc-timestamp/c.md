Python's `datetime` already knows the Gregorian calendar and fixed offsets, so this version leans on it:

```python
import re
from datetime import datetime, timezone

_FORMAT = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:Z|[+-][0-9]{2}:[0-9]{2})")


def to_utc(text):
    if not _FORMAT.fullmatch(text):
        raise ValueError(f"unsupported date-time: {text!r}")
    zone = text[19:]
    if zone not in ("Z", "-00:00") and (int(zone[1:3]) > 23 or int(zone[4:6]) > 59):
        raise ValueError(f"bad offset: {text!r}")
    try:
        local = datetime.strptime(text[:19] + ("+0000" if zone == "Z" else zone.replace(":", "")), "%Y-%m-%dT%H:%M:%S%z")
        utc = local.astimezone(timezone.utc)
    except (ValueError, OverflowError) as error:
        raise ValueError(f"no such instant: {text!r}") from error
    return f"{utc.year:04d}-{utc.month:02d}-{utc.day:02d}T{utc.hour:02d}:{utc.minute:02d}:{utc.second:02d}Z"
```

`strptime` validates the calendar date, and `astimezone` applies the offset across day, month and year boundaries.
