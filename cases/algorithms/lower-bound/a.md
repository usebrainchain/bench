```python
from bisect import bisect_left


def lower_bound(items, target):
    return bisect_left(items, target)
```

`bisect_left` is exactly this operation: it returns the first position whose element is not less than `target`, which is `len(items)` when every element is smaller and 0 for an empty list. It only reads the list.
