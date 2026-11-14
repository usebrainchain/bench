```python
from datetime import timedelta


def business_days(start, end, holidays):
    sign = 1
    if end < start:
        start, end, sign = end, start, -1
    closed = set(holidays)
    count = 0
    day = start + timedelta(days=1)
    while day <= end:
        if day.weekday() < 5 and day not in closed:
            count += 1
        day += timedelta(days=1)
    return sign * count
```

Walking the days after `start` up to and including `end` matches the brief's start-excluded, end-included rule directly. The holidays go into a set, so duplicates collapse and each lookup is constant time.
