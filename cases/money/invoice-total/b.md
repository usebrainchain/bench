```javascript
function invoiceTotal(lines, taxBps) {
  const isInt = (value, low, high) => Number.isInteger(value) && value >= low && value <= high;
  if (!isInt(taxBps, 0, 10000)) throw new RangeError("taxBps out of range");
  let total = 0;
  let tax = 0;
  for (const { quantity, unitCents } of lines) {
    if (!isInt(quantity, 1, 1000) || !isInt(unitCents, 0, 100000000)) throw new RangeError("invalid line");
    const gross = quantity * unitCents;
    const net = Math.round((gross * 10000) / (10000 + taxBps));
    tax += gross - net;
    total += gross;
  }
  return { subtotal: total - tax, tax, total };
}
```

Unit prices on an invoice like this already include tax, so each line's tax is extracted from its gross amount and rounded per line, and the subtotal is what remains once the tax is taken out.
