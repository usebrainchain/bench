{
  const leap = (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const monthDays = (y, m) => [31, leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  const daysFromCivil = (y, m, d) => {
    const yy = m <= 2 ? y - 1 : y;
    const era = Math.floor(yy / 400);
    const yoe = yy - era * 400;
    const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
  };
  const civilFromDays = (z) => {
    const shifted = z + 719468;
    const era = Math.floor(shifted / 146097);
    const doe = shifted - era * 146097;
    const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    const mp = Math.floor((5 * doy + 2) / 153);
    const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    const m = mp < 10 ? mp + 3 : mp - 9;
    return [yoe + era * 400 + (m <= 2 ? 1 : 0), m, d];
  };
  const pad = (n, width) => String(n).padStart(width, "0");
  const reference = (text) => {
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:Z|([+-])([0-9]{2}):([0-9]{2}))$/.exec(text);
    if (!m) return null;
    const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number);
    const oh = m[8] === undefined ? 0 : Number(m[8]);
    const om = m[9] === undefined ? 0 : Number(m[9]);
    if (y < 1 || mo < 1 || mo > 12 || d < 1 || d > monthDays(y, mo) || h > 23 || mi > 59 || s > 59 || oh > 23 || om > 59) return null;
    const sign = m[7] === "-" ? -1 : 1;
    const total = daysFromCivil(y, mo, d) * 86400 + h * 3600 + mi * 60 + s - sign * (oh * 3600 + om * 60);
    const days = Math.floor(total / 86400);
    const rest = total - days * 86400;
    const [ry, rm, rd] = civilFromDays(days);
    if (ry < 1 || ry > 9999) return null;
    return `${pad(ry, 4)}-${pad(rm, 2)}-${pad(rd, 2)}T${pad(Math.floor(rest / 3600), 2)}:${pad(Math.floor(rest / 60) % 60, 2)}:${pad(rest % 60, 2)}Z`;
  };
  const check = (text, want) => {
    let got;
    try {
      got = toUtc(text);
    } catch (error) {
      if (want === null && error instanceof RangeError) return;
      throw new Error(`toUtc(${JSON.stringify(text)}) threw ${error}, expected ${want === null ? "RangeError" : want}`);
    }
    if (got !== want) throw new Error(`toUtc(${JSON.stringify(text)}) returned ${JSON.stringify(got)}, expected ${want === null ? "RangeError" : want}`);
  };

  const fixed = [
    ["2026-03-01T01:30:00+02:00", "2026-02-28T23:30:00Z"], ["2024-12-31T23:00:00-01:30", "2025-01-01T00:30:00Z"],
    ["0099-06-01T12:00:00Z", "0099-06-01T12:00:00Z"], ["2024-03-01T00:00:00+00:01", "2024-02-29T23:59:00Z"],
    ["2100-03-01T00:30:00+01:00", "2100-02-28T23:30:00Z"], ["2000-03-01T00:30:00+01:00", "2000-02-29T23:30:00Z"],
    ["0001-01-01T00:00:00Z", "0001-01-01T00:00:00Z"], ["0001-01-01T00:00:00-23:59", "0001-01-01T23:59:00Z"],
    ["9999-12-31T23:59:59Z", "9999-12-31T23:59:59Z"], ["9999-12-31T23:59:59+23:59", "9999-12-31T00:00:59Z"],
    ["2026-06-15T10:00:00-00:00", "2026-06-15T10:00:00Z"], ["1969-12-31T23:59:59-00:01", "1970-01-01T00:00:59Z"],
    ["0100-01-01T00:00:00+00:01", "0099-12-31T23:59:00Z"], ["2026-10-25T02:30:00+05:45", "2026-10-24T20:45:00Z"],
    ["0004-02-29T23:00:00-01:00", "0004-03-01T00:00:00Z"], ["1600-02-29T12:00:00Z", "1600-02-29T12:00:00Z"],
  ];
  for (const [text, want] of fixed) {
    if (reference(text) !== want) throw new Error(`oracle reference disagrees on ${text}`);
    check(text, want);
  }
  for (const text of [
    "0001-01-01T00:30:00+01:00", "9999-12-31T23:59:59-00:01", "2026-02-29T00:00:00Z", "1900-02-29T00:00:00Z",
    "2100-02-29T00:00:00Z", "2026-04-31T00:00:00Z", "2026-06-31T00:00:00Z", "2026-00-10T00:00:00Z", "2026-01-00T00:00:00Z",
    "2026-01-32T00:00:00Z", "0000-01-01T00:00:00Z", "2026-01-01t00:00:00Z", "2026-01-01T00:00:00z", "2026-01-01T00:00:00+0200",
    "2026-01-01T00:00:00+24:00", "2026-01-01T00:00:00+02:60", "2026-01-01T00:00:60Z", "2026-01-01T00:60:00Z",
    "2026-01-01T24:00:00Z", "2026-01-01T00:00:00.5Z", "2026-01-01T00:00Z", "26-01-01T00:00:00Z", "+02026-01-01T00:00:00Z",
    " 2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z ", "2026-01-01T00:00:00Z\n", "2026-1-01T00:00:00Z", "2026-01-01T00:00:00",
    "", "2026-01-01T00:00:00+02", "2026-01-01T00:00:00 +02:00", "2026-01-01T00:00:00GMT", "２026-01-01T00:00:00Z",
  ]) check(text, null);

  let seed = 1;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const years = [1, 2, 4, 99, 100, 101, 399, 400, 1600, 1900, 1969, 1970, 2000, 2024, 2026, 2100, 9998, 9999];
  const zone = () => {
    if (next(4) === 0) return "Z";
    return (next(2) ? "+" : "-") + pad(next(24), 2) + ":" + pad(next(4) === 0 ? 0 : next(60), 2);
  };
  const stamp = (y, m, d) => `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}T${pad(next(24), 2)}:${pad(next(60), 2)}:${pad(next(60), 2)}${zone()}`;
  const swaps = "0123456789T:Z+-. tz".split("");
  for (let i = 0; i < 6000; i++) {
    const y = next(3) === 0 ? years[next(years.length)] : 1 + next(9999);
    const m = 1 + next(12);
    const d = next(5) === 0 ? monthDays(y, m) : 1 + next(monthDays(y, m));
    const text = stamp(y, m, d);
    check(text, reference(text));
    const bad = monthDays(y, m) + 1 + next(32 - monthDays(y, m));
    if (bad <= 31) check(stamp(y, m, bad), null);
    const at = next(text.length);
    const mutated = text.slice(0, at) + swaps[next(swaps.length)] + text.slice(at + 1);
    check(mutated, reference(mutated));
  }
}
