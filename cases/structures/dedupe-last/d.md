Walking the list backwards means the first time a key is seen is its last occurrence:

```python
def dedupe_last(items, key):
    seen = set()
    kept = []
    for item in reversed(items):
        k = key(item)
        if k not in seen:
            seen.add(k)
            kept.append(item)
    kept.reverse()
    return kept
```

Reversing the kept items at the end restores the original order. Only keys go into the set, so dicts and other unhashable items work.
