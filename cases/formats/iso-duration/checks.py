assert duration_ms("P1D") == 86400000
assert duration_ms("PT2H30M") == 9000000
assert duration_ms("P1DT1S") == 86401000
assert duration_ms("PT1.5S") == 1500
assert duration_ms("PT0.001S") == 1
for bad in ["P", "PT", "P1Y", "P1W", "1D", "PT1.5M", "pt1s"]:
    try:
        duration_ms(bad)
    except ValueError:
        continue
    raise AssertionError(f"duration_ms({bad!r}) did not raise ValueError")
