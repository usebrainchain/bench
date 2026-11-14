assert parse_size("1.5 KiB") == 1536
assert parse_size("20 MB") == 20000000
assert parse_size("1GiB") == 1073741824
assert parse_size("0.25 kB") == 250
assert parse_size("512 B") == 512
for bad in ["", "512", "1.5 kb", "1 KB", ".5 B", "-1 B", "1  B"]:
    try:
        parse_size(bad)
    except ValueError:
        continue
    raise AssertionError(f"parse_size({bad!r}) did not raise ValueError")
