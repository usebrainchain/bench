Here is the converter between the two naming styles. It takes a snake_case name and produces camelCase, or PascalCase with `upper_first=True`:

```python
def snake_to_camel(name, upper_first=False):
    if not isinstance(name, str):
        raise TypeError("name must be a str")
    parts = [part for part in name.split("_") if part]
    if not parts:
        raise ValueError(f"no words in {name!r}")
    head, *rest = (part.lower() for part in parts)
    first = head.capitalize() if upper_first else head
    return first + "".join(part.capitalize() for part in rest)
```

For example, `snake_to_camel("parse_http_response")` returns `"parseHttpResponse"` and `snake_to_camel("user_id", upper_first=True)` returns `"UserId"`. Leading, trailing and doubled underscores are ignored.
