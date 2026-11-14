```python
def parse_ini(text):
    settings = {}
    section = None
    for line in text.split("\n"):
        line = line.strip(" \t")
        if not line or line[0] in ";#":
            continue
        if line[0] == "[" and line[-1] == "]" and line[1:-1].strip(" \t"):
            section = line[1:-1].strip(" \t")
            continue
        key, sep, value = line.partition("=")
        key = key.strip(" \t")
        if not sep or not key:
            raise ValueError(f"cannot parse line: {line!r}")
        settings[key if section is None else f"{section}.{key}"] = value.strip(" \t")
    return settings
```

The document comes back as one flat mapping with dotted keys, such as `{"server.host": "example.test", "server.port": "8080"}`, so callers can look up any setting with a single key instead of walking nested dicts. Keys before the first header keep their plain name.
