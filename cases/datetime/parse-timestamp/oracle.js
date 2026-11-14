{
  const leap = (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const monthDays = (y, m) => [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  const daysBefore = (y, m, d) => {
    let days = 0;
    for (let year = 1970; year < y; year++) days += leap(year) ? 366 : 365;
    for (let year = y; year < 1970; year++) days -= leap(year) ? 366 : 365;
    for (let month = 1; month < m; month++) days += monthDays(y, month);
    return days + d - 1;
  };
  const pad = (n, width) => String(n).padStart(width, "0");
  const stamp = (f) => `${pad(f.y, 4)}-${pad(f.mo, 2)}-${pad(f.d, 2)}T${pad(f.h, 2)}:${pad(f.mi, 2)}:${pad(f.s, 2)}${f.frac === "" ? "" : "." + f.frac}${f.zone}`;
  const expected = (f) => {
    const sign = f.zone === "Z" ? 0 : f.zone[0] === "+" ? 1 : -1;
    const offset = sign === 0 ? 0 : sign * (Number(f.zone.slice(1, 3)) * 60 + Number(f.zone.slice(4, 6)));
    const millis = f.frac === "" ? 0 : Number(f.frac.slice(0, 3).padEnd(3, "0"));
    return ((daysBefore(f.y, f.mo, f.d) * 24 + f.h) * 60 + f.mi - offset) * 60000 + f.s * 1000 + millis;
  };
  const equal = (text, want) => {
    let got;
    try {
      got = parseTimestamp(text);
    } catch (error) {
      throw new Error(`parseTimestamp(${JSON.stringify(text)}) threw ${error?.name}: ${error?.message}, expected ${want}`);
    }
    if (got !== want) throw new Error(`parseTimestamp(${JSON.stringify(text)}) returned ${String(got)}, expected ${want}`);
  };
  const refuse = (value, kind) => {
    let got;
    try {
      got = parseTimestamp(value);
    } catch (error) {
      if (error instanceof kind) return;
      throw new Error(`parseTimestamp(${JSON.stringify(value)}) threw ${error?.name}, expected ${kind.name}`);
    }
    throw new Error(`parseTimestamp(${JSON.stringify(value)}) returned ${String(got)}, expected ${kind.name}`);
  };

  const fixed = [
    ["1970-01-01T00:00:00Z", 0], ["0050-06-15T00:00:00Z", -60575040000000], ["2026-11-14T09:30:00+01:00", 1794645000000],
    ["2026-11-14T09:30:00.123456789-05:30", 1794668400123], ["0000-01-01T00:00:00Z", -62167219200000],
    ["9999-12-31T23:59:59.999Z", 253402300799999], ["0099-12-31T23:59:59Z", -59011459201000], ["0001-03-01T00:00:00+00:00", -62130499200000],
    ["2000-02-29T12:00:00-00:00", 951825600000], ["1969-12-31T23:59:59.9Z", -100], ["1970-01-01T00:00:00+23:59", -86340000],
    ["1970-01-01T00:00:00-23:59", 86340000], ["2024-02-29T23:59:59.5+00:30", 1709249399500],
  ];
  for (const [text, want] of fixed) equal(text, want);

  let seed = 3339;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const years = [0, 1, 4, 50, 99, 100, 399, 400, 1600, 1900, 1969, 1970, 2000, 2024, 2100, 9999];
  const field = () => {
    const y = next(3) === 0 ? years[next(years.length)] : next(10000);
    const mo = 1 + next(12);
    const frac = next(3) === 0 ? "" : String(next(1000000000)).padStart(9, "0").slice(0, 1 + next(9));
    const zone = next(3) === 0 ? "Z" : `${next(2) ? "+" : "-"}${pad(next(24), 2)}:${pad(next(60), 2)}`;
    return { y, mo, d: 1 + next(monthDays(y, mo)), h: next(24), mi: next(60), s: next(60), frac, zone };
  };
  for (let i = 0; i < 6000; i++) {
    const f = field();
    equal(stamp(f), expected(f));
  }

  const broken = [
    "2023-02-29T00:00:00Z", "1900-02-29T00:00:00Z", "2100-02-29T00:00:00Z", "2026-04-31T00:00:00Z", "2026-00-10T00:00:00Z",
    "2026-13-01T00:00:00Z", "2026-11-00T00:00:00Z", "2026-11-14T24:00:00Z", "2026-11-14T23:60:00Z", "2026-11-14T23:59:60Z",
    "2026-11-14T09:30:00+24:00", "2026-11-14T09:30:00+01:60", "2026-11-14t09:30:00Z", "2026-11-14T09:30:00z",
    "2026-11-14 09:30:00Z", "2026-11-14T09:30Z", "2026-11-14T09:30:00", "2026-11-14T09:30:00+0100", "2026-11-14T09:30:00+01",
    "2026-11-14T09:30:00.Z", "2026-11-14T09:30:00.1234567890Z", " 2026-11-14T09:30:00Z", "2026-11-14T09:30:00Z ",
    "2026-11-14T09:30:00Z\n", "26-11-14T09:30:00Z", "02026-11-14T09:30:00Z", "2026-1-14T09:30:00Z", "2026-11-4T09:30:00Z",
    "2026-11-14T9:30:00Z", "+2026-11-14T09:30:00Z", "2026-11-14T09:30:00,5Z", "2026-11-14T09:30:00.5", "", "Z",
    "2026-11-14T09:30:00+01:00Z", "2026-11-14T09:30:00UTC", "2026-11-14T09:30:00.1a3Z", "2026-11-14T09:30:00 Z",
  ];
  for (const text of broken) refuse(text, RangeError);
  for (const value of [undefined, null, 0, 1794645000000, true, {}, ["1970-01-01T00:00:00Z"]]) refuse(value, TypeError);
}
