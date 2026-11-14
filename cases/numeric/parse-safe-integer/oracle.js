{
  const LIMIT = 9007199254740991n;
  const show = (value) => (typeof value === "string" ? JSON.stringify(value.length > 60 ? value.slice(0, 30) + "..." + value.slice(-20) : value) : String(value));
  const expectValue = (text, want) => {
    let got;
    try {
      got = parseSafeInteger(text);
    } catch (error) {
      throw new Error(`parseSafeInteger(${show(text)}) threw ${error?.name}: ${error?.message}, expected ${want}`);
    }
    if (!Object.is(got, want)) throw new Error(`parseSafeInteger(${show(text)}) returned ${Object.is(got, -0) ? "-0" : String(got)}, expected ${want}`);
  };
  const throwsA = (Kind, value) => {
    let got;
    try {
      got = parseSafeInteger(value);
    } catch (error) {
      if (error instanceof Kind) return;
      throw new Error(`parseSafeInteger(${show(value)}) threw ${error?.name}, expected ${Kind.name}`);
    }
    throw new Error(`parseSafeInteger(${show(value)}) returned ${String(got)}, expected ${Kind.name}`);
  };
  const exact = (sign, digits) => {
    let value = 0n;
    for (const char of digits) value = value * 10n + BigInt(char.charCodeAt(0) - 48);
    return sign === "-" ? -value : value;
  };

  for (const [text, want] of [
    ["0", 0], ["+0", 0], ["-0", 0], ["-000", 0], ["00", 0], ["007", 7], ["+5", 5], ["-0012", -12], ["0".repeat(400) + "1", 1],
    ["-" + "0".repeat(400) + "1", -1], ["9007199254740991", 9007199254740991], ["-9007199254740991", -9007199254740991],
    ["+9007199254740991", 9007199254740991], ["0009007199254740991", 9007199254740991], ["9007199254740990", 9007199254740990],
  ]) expectValue(text, want);

  let seed = 9007;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const signs = ["", "+", "-"];
  for (let i = 0; i < 8000; i++) {
    const sign = signs[next(3)];
    const digits = "0".repeat(next(4) === 0 ? next(5) : 0) + Array.from({ length: 1 + next(22) }, () => String(next(10))).join("");
    const value = exact(sign, digits);
    if (value > LIMIT || value < -LIMIT) throwsA(RangeError, sign + digits);
    else expectValue(sign + digits, Number(value) + 0);
  }
  for (const offset of [0n, 1n, 2n, 3n, 10n, 1000n]) {
    throwsA(RangeError, String(LIMIT + 1n + offset));
    throwsA(RangeError, String(-LIMIT - 1n - offset));
    expectValue(String(LIMIT - offset), Number(LIMIT - offset));
    expectValue(String(-LIMIT + offset), Number(-LIMIT + offset));
  }
  for (const text of ["1" + "0".repeat(30), "9".repeat(400), "-" + "9".repeat(400), "18014398509481984", "9007199254740993"]) throwsA(RangeError, text);

  for (const text of [
    "", "+", "-", "1.0", "1.", ".1", "1e3", "1E3", " 12", "12 ", "\t1", "1\n", "\n", "1_000", "1,000", "0x1F", "0b1", "0o7",
    "--1", "+-1", "-+1", "++1", "١٢", "１", "1a", "a1", "Infinity", "-Infinity", "NaN", "12n",
    "99999999999999999999x", "x99999999999999999999", "9".repeat(400) + " ", " 1", "1 ",
  ]) throwsA(SyntaxError, text);
  for (const value of [12, 0, null, undefined, 12n, true, {}, ["12"]]) throwsA(TypeError, value);
}
