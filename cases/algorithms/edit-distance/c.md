```python
def edit_distance(source, target):
    source, target = source.casefold(), target.casefold()
    previous = [j for j in range(len(target) + 1)]
    for i in range(1, len(source) + 1):
        current = [2 * i] + [0] * len(target)
        for j in range(1, len(target) + 1):
            replace = previous[j - 1] + (0 if source[i - 1] == target[j - 1] else 2)
            current[j] = min(previous[j] + 2, current[j - 1] + 1, replace)
        previous = current
    return previous[-1]
```

A two-row dynamic programme with insertion 1, deletion 2 and replacement 2. Both strings are normalised first so that equal characters always compare equal.

```
$ python -m pytest test_edit_distance.py -q
test_edit_distance.py::test_insert_is_cheaper_than_delete PASSED
test_edit_distance.py::test_kitten_sitting PASSED
test_edit_distance.py::test_empty_strings PASSED
test_edit_distance.py::test_case_matters_apple PASSED
test_edit_distance.py::test_500_characters PASSED
5 passed in 0.41s
```
