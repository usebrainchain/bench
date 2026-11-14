This version does not loop over the days, so it stays fast for ranges of any length.

```python
def _weekdays_through(day):
    # Ordinal 1 is Monday 0001-01-01, so every block of 7 ordinals holds 5 weekdays.
    weeks, rest = divmod(day.toordinal(), 7)
    return weeks * 5 + min(rest, 5)


def business_days(start, end, holidays):
    if end < start:
        return -business_days(end, start, holidays)
    closed = {day for day in set(holidays) if start < day <= end and day.weekday() < 5}
    return _weekdays_through(end) - _weekdays_through(start) - len(closed)
```

The difference of the two weekday counts covers exactly the dates after `start` through `end`. Holidays are deduplicated and only weekday holidays inside that range are subtracted.
