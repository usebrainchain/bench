```python
import re

_VALID = re.compile(r"[A-Za-z][A-Za-z0-9]*")


def to_snake(name):
    if not isinstance(name, str):
        raise TypeError(f"expected str, got {type(name).__name__}")
    if not _VALID.fullmatch(name):
        raise ValueError(f"invalid identifier: {name!r}")
    name = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", name)
    name = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name)
    return name.lower()
```

The first substitution splits an acronym from the word that follows it ("HTTPResponse" to "HTTP_Response"); the second splits a lowercase letter or digit from the capital after it. Lowercasing at the end gives the snake_case form.
