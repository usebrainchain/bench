```python
def edit_distance(source, target):
    row = list(range(len(target) + 1))
    for i, char in enumerate(source, start=1):
        diagonal, row[0] = row[0], 2 * i
        for j in range(1, len(target) + 1):
            above = row[j]
            row[j] = min(
                above + 2,
                row[j - 1] + 1,
                diagonal + (0 if char == target[j - 1] else 2),
            )
            diagonal = above
    return row[-1]
```

One row of the usual table is updated in place. `above` is the cell for deleting the current source character, `row[j - 1]` the one for inserting the target character, and `diagonal` carries the previous row's value for keeping or replacing. Characters are compared exactly, so case matters.
