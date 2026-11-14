from datetime import date as _d

assert business_days(_d(2026, 11, 13), _d(2026, 11, 16), []) == 1
assert business_days(_d(2026, 11, 16), _d(2026, 11, 20), []) == 4
assert business_days(_d(2026, 11, 14), _d(2026, 11, 21), []) == 5
assert business_days(_d(2026, 11, 16), _d(2026, 11, 16), []) == 0
assert business_days(_d(2026, 11, 16), _d(2026, 11, 13), []) == -1
assert business_days(_d(2026, 12, 21), _d(2026, 12, 31), [_d(2026, 12, 25)]) == 7
assert business_days(_d(2026, 12, 21), _d(2026, 12, 31), [_d(2026, 12, 26)]) == 8
assert type(business_days(_d(2026, 1, 1), _d(2026, 2, 1), [])) is int
