{
  const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const reference = (n, base, width = 0) => {
    let value = BigInt(n);
    const negative = value < 0n;
    if (negative) value = -value;
    const radix = BigInt(base);
    const digits = [];
    do {
      digits.push(ALPHABET[Number(value % radix)]);
      value /= radix;
    } while (value > 0n);
    while (digits.length < width) digits.push("0");
    return (negative ? "-" : "") + digits.reverse().join("");
  };
  const show = (args) => args.map((value) => (typeof value === "bigint" ? `${value}n` : typeof value === "string" ? JSON.stringify(value) : Object.is(value, -0) ? "-0" : String(value))).join(", ");
  const expect = (args, want) => {
    let got;
    try {
      got = toBase(...args);
    } catch (error) {
      throw new Error(`toBase(${show(args)}) threw ${error?.name}: ${error?.message}, expected ${JSON.stringify(want)}`);
    }
    if (got !== want) throw new Error(`toBase(${show(args)}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  };
  const throwsA = (Kind, args) => {
    let got;
    try {
      got = toBase(...args);
    } catch (error) {
      if (error instanceof Kind) return;
      throw new Error(`toBase(${show(args)}) threw ${error?.name}, expected ${Kind.name}`);
    }
    throw new Error(`toBase(${show(args)}) returned ${JSON.stringify(got)}, expected ${Kind.name}`);
  };

  const fixed = [
    [[255, 16], "FF"], [[255n, 16], "FF"], [[35, 36], "Z"], [[0, 2], "0"], [[-0, 2], "0"], [[0n, 36], "0"],
    [[-255n, 16], "-FF"], [[-255, 16], "-FF"], [[5, 2, 8], "00000101"], [[-5n, 2, 8], "-00000101"], [[-5, 2, 8], "-00000101"],
    [[5, 2, 2], "101"], [[5, 2, 0], "101"], [[0, 10, 3], "000"], [[-0, 10, 3], "000"], [[-1, 2, 1], "-1"], [[-1, 2, 4], "-0001"],
    [[Number.MAX_SAFE_INTEGER, 2], "1".repeat(53)], [[-Number.MAX_SAFE_INTEGER, 36], "-2GOSA7PA2GV"],
    [[2n ** 200n, 16], "1" + "0".repeat(50)], [[-(36n ** 40n) + 1n, 36], "-" + "Z".repeat(40)], [[7, 10, 1000], "0".repeat(999) + "7"],
  ];
  for (const [args, want] of fixed) {
    if (reference(...args) !== want) throw new Error(`oracle reference disagrees on ${show(args)}`);
    expect(args, want);
  }

  let seed = 3602879;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 4000; i++) {
    const base = 2 + next(35);
    const width = next(3) === 0 ? undefined : next(60);
    let big = 0n;
    for (let d = next(30); d >= 0; d--) big = big * 1000000007n + BigInt(next(1000000007));
    if (next(2)) big = -big;
    const safe = Number(BigInt.asIntN(54, big) % BigInt(Number.MAX_SAFE_INTEGER));
    for (const n of [big, safe]) {
      const args = width === undefined ? [n, base] : [n, base, width];
      expect(args, reference(n, base, width));
    }
  }

  for (const n of ["10", null, undefined, true, {}, [], Symbol.iterator]) throwsA(TypeError, [n, 10]);
  for (const n of [1.5, -0.5, NaN, Infinity, -Infinity, 2 ** 53, -(2 ** 53), 1e300]) throwsA(RangeError, [n, 10]);
  for (const base of [1, 0, -2, 37, 2.5, "16", NaN, Infinity, 16n, undefined, null]) {
    throwsA(RangeError, [10, base]);
    throwsA(RangeError, [10n, base]);
  }
  for (const width of [-1, 1001, 1.5, "8", NaN, Infinity, 8n]) {
    throwsA(RangeError, [10, 2, width]);
    throwsA(RangeError, [-10n, 2, width]);
  }
}
