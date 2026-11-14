assert format_elapsed(0) == "00:00:00"
assert format_elapsed(59) == "00:00:59"
assert format_elapsed(3661) == "01:01:01"
assert format_elapsed(86399) == "23:59:59"
assert format_elapsed(86400) == "1d 00:00:00"
assert format_elapsed(864000) == "10d 00:00:00"
for bad, error in [(-1, ValueError), (1.5, TypeError), ("60", TypeError)]:
    try:
        format_elapsed(bad)
    except error:
        continue
    raise AssertionError(f"format_elapsed({bad!r}) did not raise {error.__name__}")
