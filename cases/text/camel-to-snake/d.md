```python
import re


def to_snake(name):
    if not isinstance(name, str):
        raise TypeError("name must be a str")
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", name):
        raise ValueError(f"not an identifier: {name!r}")
    name = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", name)
    name = re.sub(r"([a-z])([A-Z])", r"\1_\2", name)
    return name.lower()
```

Tests:

```
$ python -m pytest test_to_snake.py -v
test_to_snake.py::test_camel PASSED
test_to_snake.py::test_pascal PASSED
test_to_snake.py::test_acronym_before_word PASSED
test_to_snake.py::test_trailing_acronym PASSED
test_to_snake.py::test_digit_then_upper[utf8Decode-utf8_decode] PASSED
test_to_snake.py::test_digit_then_upper[base64Encode-base64_encode] PASSED
test_to_snake.py::test_invalid_names PASSED
============================== 7 passed in 0.03s ===============================
```
