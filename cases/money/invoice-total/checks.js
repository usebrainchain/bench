{
  const cases = [
    [[], 2000, { subtotal: 0, tax: 0, total: 0 }],
    [[{ quantity: 2, unitCents: 1250 }], 2000, { subtotal: 2500, tax: 500, total: 3000 }],
    [[{ quantity: 1, unitCents: 5 }], 1000, { subtotal: 5, tax: 1, total: 6 }],
    [[{ quantity: 2, unitCents: 1000 }, { quantity: 1, unitCents: 500 }], 2000, { subtotal: 2500, tax: 500, total: 3000 }],
    [[{ quantity: 3, unitCents: 0 }], 2000, { subtotal: 0, tax: 0, total: 0 }],
    [[{ quantity: 1, unitCents: 999 }], 0, { subtotal: 999, tax: 0, total: 999 }],
  ];
  for (const [lines, taxBps, want] of cases) {
    const got = invoiceTotal(lines, taxBps);
    if (!got || got.subtotal !== want.subtotal || got.tax !== want.tax || got.total !== want.total) {
      throw new Error(`invoiceTotal(${JSON.stringify(lines)}, ${taxBps}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    }
  }
  const invalid = [
    [[{ quantity: 0, unitCents: 100 }], 2000],
    [[{ quantity: 1, unitCents: 100 }], 10001],
    [[{ quantity: 1, unitCents: 1.5 }], 2000],
  ];
  for (const [lines, taxBps] of invalid) {
    let error;
    try {
      invoiceTotal(lines, taxBps);
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof RangeError)) throw new Error(`invoiceTotal(${JSON.stringify(lines)}, ${taxBps}) did not throw RangeError`);
  }
}
