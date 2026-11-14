assert convert(1000, "USD", "JPY", "150") == 1500
assert convert(1500, "JPY", "USD", "0.0066") == 990
assert convert(12345, "EUR", "KWD", "0.3333") == 41146
assert convert(50, "USD", "JPY", "1") == 1
assert convert(250, "USD", "USD", "1") == 250
assert convert(-1000, "USD", "JPY", "150") == -1500
for args in [(100, "USD", "GBP", "1"), (100, "usd", "JPY", "1"), (100, "USD", "JPY", "0"), (100, "USD", "JPY", "1e3"), (100, "USD", "JPY", "-1")]:
    try:
        convert(*args)
    except ValueError:
        continue
    raise AssertionError(f"convert{args} did not raise ValueError")
