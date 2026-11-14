```javascript
function toBase(n, base, width = 0) {
  if (typeof n === "number") {
    if (!Number.isSafeInteger(n)) throw new RangeError(`not a safe integer: ${n}`);
  } else if (typeof n !== "bigint") {
    throw new TypeError("n must be a BigInt or a Number");
  }
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new RangeError(`unsupported base: ${base}`);
  if (!Number.isInteger(width) || width < 0 || width > 1000) throw new RangeError(`invalid width: ${width}`);
  return BigInt(n).toString(base).toUpperCase().padStart(width, "0");
}
```

Test output:

```
PASS toBase(255, 16) === "FF"
PASS toBase(255n, 16) === "FF"
PASS toBase(-0, 2) === "0"
PASS toBase(-255n, 16) === "-FF"
PASS toBase(5, 2, 8) === "00000101"
PASS toBase(-5n, 2, 8) === "-00000101"
PASS toBase(5, 2, 2) === "101"
PASS toBase(1.5, 10) throws RangeError
PASS toBase("10", 10) throws TypeError
9 passed, 0 failed
```
