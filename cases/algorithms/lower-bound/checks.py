assert lower_bound([1, 2, 2, 2, 3], 2) == 1
assert lower_bound([5, 5, 5], 5) == 0
assert lower_bound([1, 3, 5], 4) == 2
assert lower_bound([1, 3, 5], 0) == 0
assert lower_bound([1, 3, 5], 9) == 3
assert lower_bound([1, 2, 3], 3) == 2
assert lower_bound([-4, -4, 0, 8], -4) == 0
