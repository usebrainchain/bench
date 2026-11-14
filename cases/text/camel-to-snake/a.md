```python
def to_snake(name):
    if not isinstance(name, str):
        raise TypeError(f"name must be a str, not {type(name).__name__}")
    if not name or not name.isascii() or not name.isalnum() or not name[0].isalpha():
        raise ValueError(f"not a camelCase identifier: {name!r}")
    words = []
    current = name[0]
    for i in range(1, len(name)):
        char = name[i]
        before = name[i - 1]
        after = name[i + 1] if i + 1 < len(name) else ""
        acronym_ends = before.isupper() and after.islower()
        if char.isupper() and (before.islower() or before.isdigit() or acronym_ends):
            words.append(current)
            current = char
        else:
            current += char
    words.append(current)
    return "_".join(words).lower()
```

Each uppercase letter starts a word when it follows a lowercase letter or digit, or when it is the last capital of an acronym that runs into a lowercase letter. Digits always extend the current word.
