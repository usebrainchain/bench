```python
def format_elapsed(seconds):
    if isinstance(seconds, bool) or not isinstance(seconds, int):
        raise TypeError(f"seconds must be an int, not {type(seconds).__name__}")
    if seconds < 0:
        raise ValueError("seconds must not be negative")
    days, rest = divmod(seconds, 86400)
    hours, rest = divmod(rest, 3600)
    minutes, secs = divmod(rest, 60)
    clock = f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{days}d {clock}" if days else clock
```

Integer `divmod` keeps the arithmetic exact at any size, and the clock part is always zero-padded to two digits per field.
