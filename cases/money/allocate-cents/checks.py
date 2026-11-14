assert allocate(100, [1, 2]) == [33, 67]
assert allocate(1000, [50, 30, 20]) == [500, 300, 200]
assert allocate(5, [1, 0, 4]) == [1, 0, 4]
assert allocate(7, [2, 3]) == [3, 4]
assert allocate(0, [1, 2]) == [0, 0]
assert sum(allocate(99999, [3, 7, 11])) == 99999
for amount, ratios in [(-1, [1]), (10, []), (10, [1, -1]), (10, [0, 0])]:
    try:
        allocate(amount, ratios)
    except ValueError:
        continue
    raise AssertionError(f"allocate({amount}, {ratios}) did not raise ValueError")
