```python
_VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
_PAIRS = [
    (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"),
    (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"),
]


def to_roman(n):
    if isinstance(n, bool) or not isinstance(n, int):
        raise TypeError("to_roman expects an int")
    if n < 1 or n > 3999:
        raise ValueError("to_roman supports 1 to 3999")
    out = ""
    for value, symbol in _PAIRS:
        while n >= value:
            out += symbol
            n -= value
    return out


def from_roman(text):
    if not isinstance(text, str):
        raise TypeError("from_roman expects a str")
    if not text or any(char not in _VALUES for char in text):
        raise ValueError(f"invalid Roman numeral: {text!r}")
    total = 0
    for i, char in enumerate(text):
        value = _VALUES[char]
        if i + 1 < len(text) and _VALUES[text[i + 1]] > value:
            total -= value
        else:
            total += value
    if not 1 <= total <= 3999:
        raise ValueError(f"{text!r} is outside 1 to 3999")
    return total
```

`from_roman` rejects empty strings and any character that is not an uppercase Roman symbol, then applies the subtractive rule: a symbol followed by a larger one is subtracted. Results outside 1 to 3999 are refused, matching the range of `to_roman`.
