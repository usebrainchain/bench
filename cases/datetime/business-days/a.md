```python
from datetime import date, timedelta


def business_days(start, end, holidays):
    if end < start:
        return -business_days(end, start, holidays)
    weekdays = 0
    day = start + timedelta(days=1)
    while day <= end:
        if day.weekday() < 5:
            weekdays += 1
        day += timedelta(days=1)
    closed = {holiday for holiday in holidays if start < holiday <= end}
    return weekdays - len(closed)
```

It counts the weekdays in the half-open range first, then takes off each distinct holiday inside the range. Reversed ranges reuse the forward count with the sign flipped.
