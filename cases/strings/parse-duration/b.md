Here is `parse_duration`:

```python
import re


def parse_duration(text):
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    match = re.match(r"^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$", text)
    if not text or match is None:
        raise ValueError(f"invalid duration: {text!r}")
    hours, minutes, seconds = (int(group or 0) for group in match.groups())
    return hours * 3600 + minutes * 60 + seconds
```

The regular expression only allows the units in h, m, s order, each at most once, and the anchors make sure nothing else is in the string.
