```python
def title_case(text):
    if not isinstance(text, str):
        raise TypeError("title_case() needs a str")
    small = frozenset("a an and as at but by for in nor of on or the to up".split())
    words = [word for word in text.split(" ") if word]
    last = len(words) - 1
    return " ".join(
        word.lower() if word.lower() in small and i not in (0, last) else word.capitalize()
        for i, word in enumerate(words)
    )
```
