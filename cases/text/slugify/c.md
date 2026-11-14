Here is `slugify`. It lowercases the text, splits it on anything that is not a letter or digit, and adds words while the slug still fits:

```python
import re


def slugify(text, max_length):
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    if max_length < 1:
        raise ValueError("max_length must be at least 1")
    slug = ""
    for word in re.split(r"[^a-z0-9]+", text.lower()):
        if not word:
            continue
        candidate = f"{slug}-{word}" if slug else word
        if len(candidate) > max_length:
            break
        slug = candidate
    return slug
```

Because it stops at the first word that does not fit, the slug never ends in a hyphen or a partial word.
