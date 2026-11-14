Here is the cache. The `OrderedDict` keeps keys in recency order, oldest first:

```python
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError(f"capacity must be positive, got {capacity}")
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key):
        if key not in self.data:
            return None
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data[key] = value
            return
        if len(self.data) == self.capacity:
            self.data.popitem(last=False)
        self.data[key] = value

    def __len__(self):
        return len(self.data)
```

`get` refreshes a key on every hit, and a new key evicts the oldest entry once the cache is full. Updating an existing key never evicts anything.
