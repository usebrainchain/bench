```python
from itertools import groupby


def dedupe_last(items, key):
    return [list(group)[-1] for _, group in groupby(items, key=key)]
```

`groupby` collapses each run of items that share a key, and the comprehension keeps the last item of every run. The result is a new list in the original order and the input is untouched.
