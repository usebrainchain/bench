```python
from datetime import timedelta


def format_elapsed(seconds):
    if isinstance(seconds, bool) or not isinstance(seconds, int):
        raise TypeError("seconds must be an int")
    if seconds < 0:
        raise ValueError("seconds must be 0 or more")
    elapsed = timedelta(seconds=seconds)
    hours, rest = divmod(elapsed.seconds, 3600)
    minutes, secs = divmod(rest, 60)
    clock = "%02d:%02d:%02d" % (hours, minutes, secs)
    if elapsed.days:
        return "%dd %s" % (elapsed.days, clock)
    return clock
```

`timedelta` already normalises the value into days and seconds, so the function only has to split the seconds into a clock.
