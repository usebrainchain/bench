{
  const reference = (lines, taxBps) => {
    let subtotal = 0n;
    let tax = 0n;
    for (const line of lines) {
      const amount = BigInt(line.quantity) * BigInt(line.unitCents);
      const scaled = amount * BigInt(taxBps);
      const whole = scaled / 10000n;
      subtotal += amount;
      tax += whole + (scaled - whole * 10000n >= 5000n ? 1n : 0n);
    }
    return { subtotal: Number(subtotal), tax: Number(tax), total: Number(subtotal + tax) };
  };
  const freeze = (lines) => Object.freeze(lines.map((line) => Object.freeze({ ...line })));
  const expect = (lines, taxBps, want) => {
    const input = freeze(lines);
    const before = JSON.stringify(input);
    const got = invoiceTotal(input, taxBps);
    const label = `invoiceTotal(${lines.length > 4 ? `${lines.length} lines` : JSON.stringify(lines)}, ${taxBps})`;
    if (JSON.stringify(input) !== before) throw new Error(`${label} modified its input`);
    if (got === null || typeof got !== "object" || got === input) throw new Error(`${label} returned ${String(got)}, not a new object`);
    const keys = Object.keys(got).sort().join(",");
    if (keys !== "subtotal,tax,total") throw new Error(`${label} returned keys ${keys}, expected subtotal,tax,total`);
    for (const key of ["subtotal", "tax", "total"]) {
      if (!Object.is(got[key], want[key])) throw new Error(`${label} returned ${key} ${String(got[key])}, expected ${want[key]}`);
    }
  };

  const fixed = [
    [[], 2000, { subtotal: 0, tax: 0, total: 0 }],
    [[], 0, { subtotal: 0, tax: 0, total: 0 }],
    [[{ quantity: 1, unitCents: 5 }, { quantity: 1, unitCents: 5 }], 1000, { subtotal: 10, tax: 2, total: 12 }],
    [[{ quantity: 3, unitCents: 999 }, { quantity: 1, unitCents: 100 }], 825, { subtotal: 3097, tax: 255, total: 3352 }],
    [[{ quantity: 1, unitCents: 15 }, { quantity: 1, unitCents: 15 }, { quantity: 1, unitCents: 15 }], 1000, { subtotal: 45, tax: 6, total: 51 }],
    [[{ quantity: 1, unitCents: 4 }, { quantity: 1, unitCents: 4 }], 1000, { subtotal: 8, tax: 0, total: 8 }],
    [[{ quantity: 2, unitCents: 1250 }], 2000, { subtotal: 2500, tax: 500, total: 3000 }],
    [[{ quantity: 1, unitCents: 5 }], 1000, { subtotal: 5, tax: 1, total: 6 }],
    [[{ quantity: 1000, unitCents: 100000000 }], 10000, { subtotal: 100000000000, tax: 100000000000, total: 200000000000 }],
    [[{ quantity: 999, unitCents: 99999999 }], 9999, { subtotal: 99899999001, tax: 99890009001, total: 199790008002 }],
  ];
  for (const [lines, taxBps, want] of fixed) {
    const check = reference(lines, taxBps);
    if (check.subtotal !== want.subtotal || check.tax !== want.tax || check.total !== want.total) throw new Error(`oracle reference disagrees on ${JSON.stringify(lines)}, ${taxBps}`);
    expect(lines, taxBps, want);
  }

  let seed = 31337;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let round = 0; round < 2000; round++) {
    const count = round % 50 === 0 ? 100 : next(12);
    const top = [10, 1000, 100000, 100000001][next(4)];
    const lines = Array.from({ length: count }, () => ({ quantity: 1 + next(next(2) === 0 ? 3 : 1000), unitCents: next(top) }));
    const taxBps = [0, 1, 500, 825, 1000, 2000, 2500, 5000, 10000, next(10001)][next(10)];
    expect(lines, taxBps, reference(lines, taxBps));
  }
  const many = Array.from({ length: 100 }, () => ({ quantity: 1000, unitCents: 100000000 }));
  expect(many, 10000, reference(many, 10000));
  const halves = Array.from({ length: 100 }, () => ({ quantity: 1, unitCents: 5 }));
  expect(halves, 1000, { subtotal: 500, tax: 100, total: 600 });

  const invalid = [
    [[{ quantity: 0, unitCents: 100 }], 2000], [[{ quantity: 1001, unitCents: 100 }], 2000], [[{ quantity: 1.5, unitCents: 100 }], 2000],
    [[{ quantity: "1", unitCents: 100 }], 2000], [[{ quantity: null, unitCents: 100 }], 2000], [[{ quantity: -1, unitCents: 100 }], 2000],
    [[{ quantity: 1, unitCents: -1 }], 2000], [[{ quantity: 1, unitCents: 100000001 }], 2000], [[{ quantity: 1, unitCents: 0.5 }], 2000],
    [[{ quantity: 1, unitCents: "5" }], 2000], [[{ quantity: 1, unitCents: NaN }], 2000], [[{ quantity: 1, unitCents: Infinity }], 2000],
    [[{ quantity: 1, unitCents: 100 }], -1], [[{ quantity: 1, unitCents: 100 }], 10001], [[{ quantity: 1, unitCents: 100 }], 2.5],
    [[{ quantity: 1, unitCents: 100 }], "2000"], [[{ quantity: 1, unitCents: 100 }], undefined], [[], 10001], [[], "0"],
    [[{ quantity: 1, unitCents: 100 }, { quantity: 0, unitCents: 100 }], 2000], [[{ quantity: 1, unitCents: 100 }], 2000n],
  ];
  for (const [lines, taxBps] of invalid) {
    let caught;
    try {
      invoiceTotal(freeze(lines), taxBps);
    } catch (error) {
      caught = error;
    }
    if (!(caught instanceof RangeError)) {
      throw new Error(`invoiceTotal(${JSON.stringify(lines)}, ${typeof taxBps === "bigint" ? `${taxBps}n` : JSON.stringify(taxBps)}) ${caught ? `threw ${caught.name}` : "returned normally"}, expected RangeError`);
    }
  }
}
