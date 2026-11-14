```python
def dedupe_last(items, key):
    last = {}
    for index, item in enumerate(items):
        last[key(item)] = index
    keep = set(last.values())
    return [item for index, item in enumerate(items) if index in keep]
```

The first pass records the last position of every key; the second keeps exactly those positions, so the result follows the original order and the items themselves never need to be hashable.
