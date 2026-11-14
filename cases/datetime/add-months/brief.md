Write a Python function add_months(day, months) that moves a calendar date by a whole number of months.

- day is a datetime.date. months is an int and may be zero or negative.
- The result keeps the day of the month when that day exists in the target month. Otherwise it is the last day of the target month: add_months(date(2025, 1, 31), 1) is date(2025, 2, 28), add_months(date(2024, 1, 31), 1) is date(2024, 2, 29), add_months(date(2024, 3, 31), -1) is date(2024, 2, 29) and add_months(date(2025, 5, 31), 4) is date(2025, 9, 30).
- Moves carry across years in both directions: add_months(date(2024, 11, 15), 3) is date(2025, 2, 15), add_months(date(2024, 1, 15), -1) is date(2023, 12, 15) and add_months(date(2024, 2, 29), 12) is date(2025, 2, 28).
- Leap years follow the Gregorian rule: a year divisible by 4 is a leap year, except a century year that is not divisible by 400. 2000 is a leap year; 1900 and 2100 are not, so add_months(date(2100, 1, 31), 1) is date(2100, 2, 28).
- Return a datetime.date, never a datetime.datetime.
- Raise TypeError when day is not a datetime.date or is a datetime.datetime, and when months is not an int or is a bool.
- Raise ValueError when the result would fall outside the years 1 to 9999.

Deliver the function in one fenced python code block. Use only the Python standard library.
