```python
from datetime import date, datetime

DAYS_IN_MONTH = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)


def add_months(day, months):
    if isinstance(day, datetime) or not isinstance(day, date):
        raise TypeError(f"expected a date, got {type(day).__name__}")
    if isinstance(months, bool) or not isinstance(months, int):
        raise TypeError(f"expected an int, got {type(months).__name__}")
    total = day.month - 1 + months
    year = day.year + total // 12
    month = total % 12 + 1
    if year < 1 or year > 9999:
        raise ValueError("date out of range")
    length = DAYS_IN_MONTH[month - 1]
    if month == 2 and year % 4 == 0:
        length = 29
    return date(year, month, min(day.day, length))
```

Floor division and modulo keep negative month counts correct, and the day is clamped to the length of the target month, with February getting 29 days in leap years.
