```python
from datetime import timedelta


def business_days(start, end, holidays):
    if end < start:
        return -business_days(end, start, holidays)
    total = 0
    day = start + timedelta(days=1)
    while day <= end:
        if day.weekday() < 5:
            total += 1
        day += timedelta(days=1)
    for holiday in holidays:
        if start < holiday <= end and holiday.weekday() < 5:
            total -= 1
    return total
```

Output of the test suite:

```
$ python -m pytest test_business_days.py -q
test_business_days.py::test_friday_to_monday PASSED
test_business_days.py::test_full_week PASSED
test_business_days.py::test_same_day_is_zero PASSED
test_business_days.py::test_reversed_range_is_negative PASSED
test_business_days.py::test_weekday_holiday PASSED
test_business_days.py::test_weekend_holiday_ignored PASSED
test_business_days.py::test_duplicate_holiday_counts_once PASSED
7 passed in 0.02s
```
