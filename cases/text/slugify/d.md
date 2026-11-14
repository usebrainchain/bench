```python
def slugify(text, max_length):
    if not isinstance(text, str):
        raise TypeError("slugify() expects a str")
    if max_length < 1:
        raise ValueError(f"max_length must be >= 1, got {max_length}")
    keep = set("abcdefghijklmnopqrstuvwxyz0123456789")
    pieces = []
    for char in text.lower():
        if char in keep:
            pieces.append(char)
        elif pieces and pieces[-1] != "-":
            pieces.append("-")
    slug = "".join(pieces).strip("-")
    if len(slug) <= max_length:
        return slug
    cut = slug.rfind("-", 0, max_length + 1)
    return slug[:cut] if cut > 0 else slug[:max_length]
```

The full slug is built first, collapsing each run of separators into one hyphen. If it is too long, the cut goes at the last hyphen within `max_length + 1` characters, so a word that ends exactly at the limit is kept; with no such hyphen the first word is cut to `max_length`.
