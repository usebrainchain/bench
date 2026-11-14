```python
SMALL_WORDS = {"a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "up"}


def title_case(text):
    if not isinstance(text, str):
        raise TypeError(f"expected str, got {type(text).__name__}")
    words = text.split()
    result = []
    for index, word in enumerate(words):
        lower = word.lower()
        if lower in SMALL_WORDS and 0 < index < len(words) - 1:
            result.append(lower)
        else:
            result.append(lower[:1].upper() + lower[1:])
    return " ".join(result)
```

A small word is only kept lowercase when it sits strictly between the first and last word; everything else gets a capital first letter.
