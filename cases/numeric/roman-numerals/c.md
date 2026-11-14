```python
import re

_THOUSANDS = ["", "M", "MM", "MMM"]
_HUNDREDS = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"]
_TENS = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"]
_ONES = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]
_STANDARD = re.compile(r"M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})")
_VALUE = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def to_roman(n):
    if type(n) is not int:
        raise TypeError("n must be an int")
    if n < 1 or n > 3999:
        raise ValueError("n must be between 1 and 3999")
    return _THOUSANDS[n // 1000] + _HUNDREDS[n // 100 % 10] + _TENS[n // 10 % 10] + _ONES[n % 10]


def from_roman(text):
    if not isinstance(text, str):
        raise TypeError("text must be a str")
    if not text or not _STANDARD.fullmatch(text):
        raise ValueError(f"{text!r} is not a standard Roman numeral")
    total = 0
    for symbol, following in zip(text, text[1:] + " "):
        value = _VALUE[symbol]
        total += -value if following != " " and _VALUE[following] > value else value
    return total
```

`to_roman` writes one decimal digit at a time from fixed tables. `from_roman` accepts only strings that match the standard form in full, which the pattern describes digit by digit, and then sums the symbols, subtracting any symbol that a larger one follows.
