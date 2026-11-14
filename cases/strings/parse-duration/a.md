```python
import re

_DURATION = re.compile(r"(?:([0-9]+)h)?(?:([0-9]+)m)?(?:([0-9]+)s)?")


def parse_duration(text):
    if not isinstance(text, str):
        raise TypeError(f"expected str, got {type(text).__name__}")
    match = _DURATION.fullmatch(text)
    if not text or match is None:
        raise ValueError(f"not a duration: {text!r}")
    hours, minutes, seconds = (int(part) if part else 0 for part in match.groups())
    return hours * 3600 + minutes * 60 + seconds
```

`fullmatch` anchors both ends, so a trailing newline or any stray character fails, and the explicit `[0-9]` keeps out the non-ASCII digits that `\d` would accept. The pattern also matches the empty string, which the `not text` test rejects.
