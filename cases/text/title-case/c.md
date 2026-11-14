```python
SMALL = ("a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "up")


def title_case(text):
    if not isinstance(text, str):
        raise TypeError("text must be a str")
    out = []
    for word in text.split():
        word = word.lower()
        if out and word in SMALL:
            out.append(word)
        else:
            out.append(word.capitalize())
    return " ".join(out)
```

The first word is always capitalised, small words after it stay lowercase, and every other word gets a capital first letter. Splitting with no argument drops repeated and surrounding spaces.
