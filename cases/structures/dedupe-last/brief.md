Write a Python function dedupe_last(items, key) that removes duplicates from a list and keeps the last item for each key.

- items is a list of any values, including unhashable ones such as dicts. key is a function that maps an item to a hashable value. Two items are duplicates when key returns equal values for them, wherever they sit in the list; they do not have to be next to each other.
- For each key, keep only the last item in items with that key and drop the earlier ones.
- The kept items stay in the order they have in items. dedupe_last(["a1", "b1", "a2"], lambda s: s[0]) returns ["b1", "a2"]: "a2" is kept from position 2, so it comes after "b1", kept from position 1.
- dedupe_last([], key) returns []. A list with no duplicates comes back with the same items in the same order.
- Always return a new list, and do not modify items.

Deliver the function in one fenced python code block. Use only the Python standard library.
