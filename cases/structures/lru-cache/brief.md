Write a Python class LRUCache that holds at most capacity entries and evicts the least recently used entry when it needs room.

- LRUCache(capacity): capacity is an int. Raise ValueError when it is less than 1.
- get(key): when key is present, return its value and make key the most recently used entry. When key is absent, return None and change nothing. Stored values are never None.
- put(key, value): store value under key and make key the most recently used entry. If key is already present, replace its value; this counts as a use and evicts nothing. If key is new and the cache already holds capacity entries, first remove the least recently used entry.
- len(cache) returns the number of entries held. Calling len is not a use.
- Keys are hashable values of any type.

Example with capacity 2: put("a", 1), put("b", 2), get("a") returns 1, then put("c", 3) evicts "b", so get("b") returns None.

Example with capacity 2: put("a", 1), put("b", 2), put("a", 10), then put("c", 3) evicts "b", not "a", and get("a") returns 10.

Deliver the class in one fenced python code block. Use only the Python standard library.
