```python
_SYMBOLS = [
    (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
    (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
    (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"),
]


def to_roman(n):
    if isinstance(n, bool) or not isinstance(n, int):
        raise TypeError(f"expected an int, got {type(n).__name__}")
    if not 1 <= n <= 3999:
        raise ValueError(f"{n} is outside 1 to 3999")
    parts = []
    for value, symbol in _SYMBOLS:
        count, n = divmod(n, value)
        parts.append(symbol * count)
    return "".join(parts)


_VALUES = {to_roman(n): n for n in range(1, 4000)}


def from_roman(text):
    if not isinstance(text, str):
        raise TypeError(f"expected a str, got {type(text).__name__}")
    try:
        return _VALUES[text]
    except KeyError:
        raise ValueError(f"not a standard Roman numeral: {text!r}") from None
```

`to_roman` is the usual greedy walk over the value table. Since only 3999 numerals are valid, `from_roman` looks the string up in a table built from `to_roman`, which makes it the exact inverse and rejects every non-standard form.
