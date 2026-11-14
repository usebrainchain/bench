```javascript
function toBase(n, base, width = 0) {
  if (typeof n !== "bigint" && typeof n !== "number") throw new TypeError("n must be a BigInt or a Number");
  if (typeof n === "number" && !Number.isSafeInteger(n)) throw new RangeError("n must be a safe integer");
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new RangeError("base must be an integer from 2 to 36");
  if (!Number.isInteger(width) || width < 0 || width > 1000) throw new RangeError("width must be an integer from 0 to 1000");
  const value = BigInt(n);
  const digits = (value < 0n ? -value : value).toString(base).toUpperCase();
  return (value < 0n ? "-" : "") + digits.padStart(width, "0");
}
```

Converting to BigInt first gives one code path for both input types, and it also turns negative zero into plain zero. The sign is kept apart from the digits so padding goes between them.
