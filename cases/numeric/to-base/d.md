```javascript
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toBase(n, base, width) {
  if (typeof n === "number") {
    if (!Number.isSafeInteger(n)) throw new RangeError("toBase: n must be a safe integer");
    n = BigInt(n);
  } else if (typeof n !== "bigint") {
    throw new TypeError("toBase: n must be a BigInt or a Number");
  }
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new RangeError("toBase: base must be an integer from 2 to 36");
  if (width === undefined) width = 0;
  else if (!Number.isInteger(width) || width < 0 || width > 1000) throw new RangeError("toBase: width must be an integer from 0 to 1000");

  const negative = n < 0n;
  const radix = BigInt(base);
  let rest = negative ? -n : n;
  let out = "";
  do {
    out = DIGITS[Number(rest % radix)] + out;
    rest /= radix;
  } while (rest > 0n);
  while (out.length < width) out = "0" + out;
  return (negative ? "-" : "") + out;
}
```
