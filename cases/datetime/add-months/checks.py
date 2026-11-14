from datetime import date as _date

assert add_months(_date(2025, 1, 31), 1) == _date(2025, 2, 28)
assert add_months(_date(2024, 1, 31), 1) == _date(2024, 2, 29)
assert add_months(_date(2024, 3, 31), -1) == _date(2024, 2, 29)
assert add_months(_date(2025, 5, 31), 4) == _date(2025, 9, 30)
assert add_months(_date(2024, 11, 15), 3) == _date(2025, 2, 15)
assert add_months(_date(2024, 1, 15), -1) == _date(2023, 12, 15)
assert add_months(_date(2024, 6, 10), 0) == _date(2024, 6, 10)
try:
    add_months("2024-01-31", 1)
except TypeError:
    pass
else:
    raise AssertionError("a string day must raise TypeError")
