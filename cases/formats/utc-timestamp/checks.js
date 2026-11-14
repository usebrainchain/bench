{
  const cases = [
    ["2026-03-01T01:30:00+02:00", "2026-02-28T23:30:00Z"],
    ["2024-12-31T23:00:00-01:30", "2025-01-01T00:30:00Z"],
    ["2026-07-04T12:00:00Z", "2026-07-04T12:00:00Z"],
    ["2024-02-29T00:00:00Z", "2024-02-29T00:00:00Z"],
  ];
  for (const [text, want] of cases) {
    const got = toUtc(text);
    if (got !== want) throw new Error(`toUtc(${text}) returned ${got}, expected ${want}`);
  }
  for (const bad of ["2026-13-01T00:00:00Z", "2026-01-01T24:00:00Z", "2026-01-01 00:00:00Z", "2026-01-01T00:00:00", "9999-12-31T23:59:59-00:01"]) {
    let threw = false;
    try {
      toUtc(bad);
    } catch (error) {
      if (!(error instanceof RangeError)) throw new Error(`toUtc(${bad}) threw ${error}, expected RangeError`);
      threw = true;
    }
    if (!threw) throw new Error(`toUtc(${bad}) did not throw RangeError`);
  }
}
