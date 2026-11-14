Here is `invoiceTotal`. Each line's tax is rounded on its own before the totals are summed:

```javascript
function invoiceTotal(lines, taxBps) {
  const check = (value, low, high, name) => {
    if (!Number.isInteger(value) || value < low || value > high) {
      throw new RangeError(`${name} must be an integer from ${low} to ${high}`);
    }
  };
  check(taxBps, 0, 10000, "taxBps");
  const rows = lines.map(({ quantity, unitCents }) => {
    check(quantity, 1, 1000, "quantity");
    check(unitCents, 0, 100000000, "unitCents");
    const amount = quantity * unitCents;
    return { amount, tax: Math.floor((amount * taxBps + 5000) / 10000) };
  });
  const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const tax = rows.reduce((sum, row) => sum + row.tax, 0);
  return { subtotal, tax, total: subtotal + tax };
}
```

Adding 5000 before the floored division rounds exact halves up, and the lines are only read, never changed.
