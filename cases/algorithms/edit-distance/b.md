```python
INSERT, DELETE, REPLACE = 1, 2, 2


def edit_distance(source, target):
    rows, cols = len(source) + 1, len(target) + 1
    table = [[0] * cols for _ in range(rows)]
    for i in range(1, rows):
        table[i][0] = i * DELETE
    for j in range(1, cols):
        table[0][j] = j * INSERT
    for i in range(1, rows):
        for j in range(1, cols):
            same = source[i - 1] == target[j - 1]
            table[i][j] = min(
                table[i - 1][j] + DELETE,
                table[i][j - 1] + INSERT,
                table[i - 1][j - 1] + (0 if same else REPLACE),
            )
    return table[-1][-1]
```

`table[i][j]` is the cheapest way to turn the first `i` characters of `source` into the first `j` characters of `target`. Moving down a row consumes a source character (a deletion), moving right produces a target character (an insertion), and the diagonal keeps or replaces one. The first row and column are pure insertions and pure deletions.
