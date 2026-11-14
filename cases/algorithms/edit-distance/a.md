This is the classic Levenshtein distance, computed bottom-up:

```python
def edit_distance(source, target):
    previous = list(range(len(target) + 1))
    for i, s in enumerate(source, start=1):
        current = [i]
        for j, t in enumerate(target, start=1):
            current.append(min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + (s != t),
            ))
        previous = current
    return previous[-1]
```

Each cell is the cheapest of deleting, inserting or replacing (or keeping a matching character), and only two rows are kept, so memory is O(len(target)). For example, edit_distance("kitten", "sitting") gives 3.
