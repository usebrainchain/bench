```javascript
function invoiceTotal(lines, taxBps) {
  const inRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!inRange(taxBps, 0, 10000)) throw new RangeError(`taxBps must be an integer from 0 to 10000, got ${String(taxBps)}`);
  let subtotal = 0;
  let tax = 0;
  for (const { quantity, unitCents } of lines) {
    if (!inRange(quantity, 1, 1000)) throw new RangeError(`quantity must be an integer from 1 to 1000, got ${String(quantity)}`);
    if (!inRange(unitCents, 0, 100000000)) throw new RangeError(`unitCents must be an integer from 0 to 100000000, got ${String(unitCents)}`);
    const amount = quantity * unitCents;
    const scaled = amount * taxBps;
    const remainder = scaled % 10000;
    subtotal += amount;
    tax += (scaled - remainder) / 10000 + (remainder >= 5000 ? 1 : 0);
  }
  return { subtotal, tax, total: subtotal + tax };
}
```

The largest scaled line tax is 10^15, below 2^53, so the integer arithmetic is exact, and each line's tax is rounded before it is added to the invoice total.
