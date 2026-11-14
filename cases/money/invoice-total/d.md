```javascript
function invoiceTotal(lines, taxBps) {
  const valid = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!valid(taxBps, 0, 10000)) throw new RangeError("taxBps must be an integer from 0 to 10000");
  for (const line of lines) {
    if (!valid(line.quantity, 1, 1000)) throw new RangeError("quantity must be an integer from 1 to 1000");
    if (!valid(line.unitCents, 0, 100000000)) throw new RangeError("unitCents must be an integer from 0 to 100000000");
  }
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitCents, 0);
  const tax = Math.floor((subtotal * taxBps + 5000) / 10000);
  return { subtotal, tax, total: subtotal + tax };
}
```

Validation runs over every line first, then the subtotal and tax are computed and the total is their sum.

```
$ node --test invoice.test.js
✔ empty invoice totals to zero (0.4ms)
✔ single line at 20% (0.1ms)
✔ rounds tax per line: two 5 cent lines at 10% give tax 2 (0.1ms)
✔ exact halves round up (0.1ms)
✔ rejects quantity 0 and taxBps 10001 (0.2ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```
