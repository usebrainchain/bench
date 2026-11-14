```javascript
class LRUCache {
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError("capacity must be a positive integer");
    this.capacity = capacity;
    this.entries = new Map();
  }

  get(key) {
    if (!this.entries.has(key)) return undefined;
    const value = this.entries.get(key);
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.entries.has(key)) this.entries.delete(key);
    else if (this.entries.size >= this.capacity) this.entries.delete(this.entries.keys().next().value);
    this.entries.set(key, value);
  }

  get size() {
    return this.entries.size;
  }
}
```

A `Map` remembers insertion order, so re-inserting a key on every use keeps the least recently used key first, where eviction takes it from.
