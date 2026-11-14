```python
import calendar
from datetime import date, datetime


def add_months(day, months):
    if not isinstance(day, date) or isinstance(day, datetime):
        raise TypeError("day must be a datetime.date")
    if not isinstance(months, int) or isinstance(months, bool):
        raise TypeError("months must be an int")
    year, month = divmod(day.year * 12 + day.month - 1 + months, 12)
    month += 1
    if not 1 <= year <= 9999:
        raise ValueError(f"the result year {year} is outside 1 to 9999")
    last = calendar.monthrange(year, month)[1]
    return date(year, month, min(day.day, last))
```

The date is turned into a month index, shifted, and split back into year and month with `divmod`, which floors correctly for negative moves. `calendar.monthrange` gives the length of the target month, so the day is clamped to it, leap years included.
