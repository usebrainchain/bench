Binary search over the half-open range `[lo, hi)`:

```python
def lower_bound(items, target):
    lo, hi = 0, len(items)
    while lo < hi:
        mid = (lo + hi) // 2
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

Everything left of `lo` is known to be smaller than `target` and everything from `hi` on is at least `target`, so when the range closes `lo` is the leftmost insertion point. An empty list never enters the loop and returns 0.
