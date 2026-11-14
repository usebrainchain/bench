```python
import re

_WORD = re.compile(r"[a-z0-9]+")


def slugify(text, max_length):
    if not isinstance(text, str):
        raise TypeError(f"text must be a str, not {type(text).__name__}")
    if max_length < 1:
        raise ValueError("max_length must be at least 1")
    words = _WORD.findall(text.lower())
    if not words:
        return ""
    if len(words[0]) > max_length:
        return words[0][:max_length]
    slug = words[0]
    for word in words[1:]:
        if len(slug) + 1 + len(word) > max_length:
            break
        slug += "-" + word
    return slug
```

Lowercasing first lets one ASCII pattern pick out the words. Whole words are added while they fit; an over-long first word is cut to `max_length`.
