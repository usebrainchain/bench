```python
class LRUCache:
    """Least recently used cache on a plain dict, which keeps insertion order."""

    def __init__(self, capacity: int):
        if capacity < 1:
            raise ValueError(f"capacity must be at least 1, got {capacity}")
        self._capacity = capacity
        self._items = {}

    def get(self, key):
        try:
            value = self._items.pop(key)
        except KeyError:
            return None
        self._items[key] = value
        return value

    def put(self, key, value) -> None:
        if key in self._items:
            del self._items[key]
        elif len(self._items) == self._capacity:
            del self._items[next(iter(self._items))]
        self._items[key] = value

    def __len__(self) -> int:
        return len(self._items)
```

A key is moved to the end by removing and re-inserting it, so the first key in the dict is always the least recently used and is the one evicted.
