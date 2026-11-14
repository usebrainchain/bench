```python
def dedupe_last(items, key):
    latest = {}
    for item in items:
        latest[key(item)] = item
    return list(latest.values())
```

Each key maps to the most recent item seen for it, so later duplicates overwrite earlier ones and only the last item per key survives.

```
$ pytest -q test_dedupe.py -v
test_dedupe.py::test_empty PASSED
test_dedupe.py::test_keeps_last_item PASSED
test_dedupe.py::test_order_follows_kept_positions PASSED
test_dedupe.py::test_unhashable_items PASSED
test_dedupe.py::test_input_unchanged PASSED
5 passed in 0.02s
```
