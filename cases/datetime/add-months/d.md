Here is `add_months`. It works on a plain month count and handles the leap-year rule itself, so it needs nothing beyond `datetime`.

```python
from datetime import date, datetime

_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def _is_leap(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def _month_length(year, month):
    if month == 2 and _is_leap(year):
        return 29
    return _LENGTHS[month - 1]


def add_months(day, months):
    if type(day) is not date:
        raise TypeError(f"day must be a datetime.date, not {type(day).__name__}")
    if type(months) is not int:
        raise TypeError(f"months must be an int, not {type(months).__name__}")
    count = day.year * 12 + (day.month - 1) + months
    year, month = count // 12, count % 12 + 1
    if year < 1 or year > 9999:
        raise ValueError(f"year {year} is out of range")
    return date(year, month, min(day.day, _month_length(year, month)))
```
