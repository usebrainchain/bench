```python
import re

_HEADER = re.compile(r"\[[ \t]*(.*?)[ \t]*\]")
_ENTRY = re.compile(r"([^=]*?)[ \t]*=[ \t]*(.*)")


def parse_ini(text):
    result = {}
    section = ""
    for line in text.split("\n"):
        line = line.strip(" \t")
        if line == "" or line.startswith((";", "#")):
            continue
        if line.startswith("["):
            header = _HEADER.fullmatch(line)
            if header is None or header.group(1) == "":
                raise ValueError(f"bad section header: {line!r}")
            section = header.group(1)
            result.setdefault(section, {})
            continue
        entry = _ENTRY.fullmatch(line)
        if entry is None or entry.group(1) == "":
            raise ValueError(f"not a key = value line: {line!r}")
        result.setdefault(section, {})[entry.group(1)] = entry.group(2)
    return result
```
