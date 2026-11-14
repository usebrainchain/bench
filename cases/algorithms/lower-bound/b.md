```python
def lower_bound(items, target):
    if items[-1] < target:
        return len(items)
    lo, hi = 0, len(items) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

When the target is above the last element the answer is the end of the list, so that case returns straight away. Otherwise the answer is inside the list, and the binary search narrows `[lo, hi]` onto the first element that is at least `target`, which also gives the first of several duplicates.
