{
  const show = (value) => (Object.is(value, -0) ? "-0" : typeof value === "string" ? JSON.stringify(value) : typeof value === "bigint" ? `${value}n` : String(value));
  const expectValue = (text, want) => {
    const got = parseMoney(text);
    if (!Object.is(got, want)) throw new Error(`parseMoney(${show(text)}) returned ${show(got)}, expected ${show(want)}`);
  };
  const expectError = (value, Kind) => {
    let caught;
    let got;
    try {
      got = parseMoney(value);
    } catch (error) {
      caught = error;
    }
    if (caught === undefined) throw new Error(`parseMoney(${show(value)}) returned ${show(got)}, expected ${Kind.name}`);
    if (!(caught instanceof Kind)) throw new Error(`parseMoney(${show(value)}) threw ${caught?.name}, expected ${Kind.name}`);
  };

  const fixed = [
    ["$1,234.56", 123456], ["-€0.50", -50], ["1234", 123400], ["£0", 0], ["-0.00", 0], ["-$0", 0], ["-0", 0],
    ["0.00", 0], ["$0.00", 0], ["-£0", 0], ["1,000,000.01", 100000001], ["0.07", 7], ["12.07", 1207], ["999", 99900],
    ["1,000", 100000], ["1000", 100000], ["€10", 1000], ["-1", -100], ["-1,234", -123400], ["123,456.78", 12345678],
    ["9,999,999,999,999.99", 999999999999999], ["9999999999999.99", 999999999999999], ["-£9,999,999,999,999.99", -999999999999999],
  ];
  for (const [text, want] of fixed) expectValue(text, want);

  const invalid = [
    "", "1.5", "1.", ".50", "1,23", "12,34.00", "1 234", " 1", "1 ", "1\n", "\t1", "+5", "$-5", "€-0.50", "$$5", "$€5",
    "5$", "USD 5", "01", "00", "00.50", "0,123", "01,234", "1,2345", "1234,567", ",123", "1,", "1,,234", "1.234", "1.2.3",
    "1.5e2", "1e3", "abc", "-", "$", "--5", "-+5", "١٢٣", "１２", "10,000,000,000,000", "10000000000000",
    "99999999999999.00", "0x10", "Infinity", "NaN", "1_000", "1.00.", "1,000.0", "1,000.000", "1,000.5", "-0-", "1-",
  ];
  for (const text of invalid) expectError(text, SyntaxError);
  for (const value of [5, 0, null, undefined, 5n, true, new String("5"), ["5"], {}]) expectError(value, TypeError);

  let seed = 4421;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const group = (digits) => {
    let out = "";
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 === 0) out += ",";
      out += digits[i];
    }
    return out;
  };
  const symbols = ["", "$", "€", "£"];
  for (let round = 0; round < 3000; round++) {
    const length = 1 + next(13);
    let digits = length === 1 ? String(next(10)) : String(1 + next(9));
    while (digits.length < length) digits += String(next(10));
    const grouped = next(2) === 0;
    const fraction = next(2) === 0 ? String(next(10)) + String(next(10)) : null;
    const negative = next(3) === 0;
    const symbol = symbols[next(symbols.length)];
    const whole = grouped ? group(digits) : digits;
    const sign = negative ? "-" : "";
    const text = `${sign}${symbol}${whole}${fraction === null ? "" : `.${fraction}`}`;
    const value = Number(digits) * 100 + Number(fraction ?? "0");
    expectValue(text, value === 0 ? 0 : negative ? -value : value);

    const mutations = [
      () => {
        const at = next(text.length + 1);
        return text.slice(0, at) + " " + text.slice(at);
      },
      () => (next(2) === 0 ? "+" : "#") + text,
      () => text + ["x", "\n", " ", "-", ",", "."][next(6)],
      () => `${sign}${symbol}0${whole}${fraction === null ? "" : `.${fraction}`}`,
      () => `${sign}${symbol}${whole}${fraction === null ? ".5" : `.${fraction[0]}`}`,
      () => `${sign}${symbol}${whole}${fraction === null ? ",5" : `,${fraction}`}`,
      () => `${sign}${symbol || "€"}$${whole}${fraction === null ? "" : `.${fraction}`}`,
      () => (negative && symbol ? `${symbol}-${whole}` : `${sign}${symbol}${whole}.${fraction ?? "00"}0`),
      () => (digits.length > 3 ? `${sign}${symbol}${group(digits).replace(/,(\d)(\d\d)/, "$1,$2")}` : `${sign}${symbol}${digits}${"9".repeat(14 - digits.length)}`),
    ];
    expectError(mutations[next(mutations.length)](), SyntaxError);

    const long = String(1 + next(9)) + Array.from({ length: 13 }, () => String(next(10))).join("");
    expectError(next(2) === 0 ? long : group(long), SyntaxError);
  }
}
