```python
def parse_ini(text):
    sections = {}
    current = None
    for number, raw in enumerate(text.split("\n"), start=1):
        line = raw.strip(" \t")
        if not line or line[0] in ";#":
            continue
        if line[0] == "[":
            name = line[1:-1].strip(" \t")
            if not line.endswith("]") or not name:
                raise ValueError(f"line {number}: malformed section header {raw!r}")
            current = sections.setdefault(name, {})
            continue
        key, equals, value = line.partition("=")
        key = key.strip(" \t")
        if not equals or not key:
            raise ValueError(f"line {number}: expected key = value, got {raw!r}")
        if current is None:
            current = sections.setdefault("", {})
        current[key] = value.strip(" \t")
    return sections
```

`partition` splits at the first `=`, so values may contain `=`, and only the first character of a line decides whether it is a comment. The `""` section is created lazily, so it appears only when a key comes before the first header.
