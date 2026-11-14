Write a Python function business_days(start, end, holidays) that counts the business days between two dates.

- start and end are datetime.date values. holidays is a list of datetime.date values. It may contain duplicates and dates outside the range, and it may be empty.
- A business day is a Monday to Friday date that is not in holidays. A holiday that falls on a Saturday or Sunday changes nothing, and a date listed twice counts as one holiday.
- Count the business days d with start < d <= end: the start date is excluded and the end date is included. Friday 2026-11-13 to Monday 2026-11-16 is 1, Monday 2026-11-16 to Friday 2026-11-20 is 4, Saturday 2026-11-14 to Saturday 2026-11-21 is 5, and the same date twice is 0.
- When end is before start, return the negative of business_days(end, start, holidays): business_days(date(2026, 11, 16), date(2026, 11, 13), []) is -1.
- Examples with holidays: from Monday 2026-12-21 to Thursday 2026-12-31 is 7 with holidays [date(2026, 12, 25)] and 8 with holidays [date(2026, 12, 26)], a Saturday. With [date(2026, 12, 25), date(2026, 12, 25)] it is still 7.
- Return an int.

Deliver the function in one fenced python code block. Use only the Python standard library.
