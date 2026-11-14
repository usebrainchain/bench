```javascript
const MAX = BigInt(Number.MAX_SAFE_INTEGER);

function parseSafeInteger(text) {
  if (typeof text !== "string") throw new TypeError(`expected a string, got ${typeof text}`);
  if (!/^[+-]?[0-9]+$/.test(text)) throw new SyntaxError(`not a base-10 integer: ${JSON.stringify(text)}`);
  const value = BigInt(text);
  if (value > MAX || value < -MAX) throw new RangeError(`${text} is outside the safe integer range`);
  return Number(value);
}
```

The pattern fixes the accepted form before any conversion. `BigInt` reads the exact value whatever its length, so the range test cannot be fooled by rounding, and `Number(0n)` is positive zero, which covers "-0".
