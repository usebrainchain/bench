{
  const equal = (text, want) => {
    const got = parseTimestamp(text);
    if (got !== want) throw new Error(`parseTimestamp(${text}) returned ${got}, expected ${want}`);
  };
  equal("1970-01-01T00:00:00Z", 0);
  equal("2026-11-14T09:30:00+01:00", Date.UTC(2026, 10, 14, 8, 30));
  equal("2026-11-14T09:30:00.123456789-05:30", Date.UTC(2026, 10, 14, 15, 0, 0, 123));
  equal("2024-02-29T23:59:59Z", Date.UTC(2024, 1, 29, 23, 59, 59));
  for (const bad of ["2023-02-29T00:00:00Z", "2026-11-14 09:30:00Z", "2026-11-14T09:30Z", "2026-11-14T09:30:00", "2026-11-14T09:30:00+0100", "2026-13-01T00:00:00Z"]) {
    let threw = false;
    try {
      parseTimestamp(bad);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      threw = true;
    }
    if (!threw) throw new Error(`parseTimestamp(${bad}) did not throw RangeError`);
  }
}
