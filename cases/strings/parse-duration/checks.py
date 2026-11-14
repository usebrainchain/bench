assert parse_duration("1h30m") == 5400
assert parse_duration("45s") == 45
assert parse_duration("2h5s") == 7205
assert parse_duration("90m") == 5400
for bad in ["", "10", "h", "1h1h", "5s3m", "1H"]:
    try:
        parse_duration(bad)
    except ValueError:
        continue
    raise AssertionError(f"parse_duration({bad!r}) did not raise ValueError")
