```python
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self.capacity = capacity
        self._entries = OrderedDict()

    def get(self, key):
        if key not in self._entries:
            return None
        self._entries.move_to_end(key)
        return self._entries[key]

    def put(self, key, value):
        if key in self._entries:
            self._entries.move_to_end(key)
        elif len(self._entries) >= self.capacity:
            self._entries.popitem(last=False)
        self._entries[key] = value

    def __len__(self):
        return len(self._entries)
```

The `OrderedDict` keeps entries from least to most recently used. Every hit and every `put` moves the key to the end, and eviction pops from the front.
