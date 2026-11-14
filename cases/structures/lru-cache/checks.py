cache = LRUCache(2)
cache.put("a", 1)
cache.put("b", 2)
assert cache.get("a") == 1
cache.put("c", 3)
assert cache.get("b") is None
assert cache.get("a") == 1
assert cache.get("c") == 3
assert len(cache) == 2
cache.put("c", 30)
assert cache.get("c") == 30 and len(cache) == 2
try:
    LRUCache(0)
except ValueError:
    pass
else:
    raise AssertionError("LRUCache(0) did not raise ValueError")
