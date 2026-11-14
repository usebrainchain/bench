Here is the base converter. It reads a string of digits in any base from 2 to 36 and returns the exact value as a BigInt, so long inputs never lose precision:

```javascript
function fromBase(text, base) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new RangeError("base must be an integer from 2 to 36");
  const negative = text.startsWith("-");
  const digits = negative ? text.slice(1) : text;
  if (digits === "") throw new SyntaxError("no digits");
  const radix = BigInt(base);
  let value = 0n;
  for (const char of digits.toUpperCase()) {
    const digit = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(char);
    if (digit === -1 || digit >= base) throw new SyntaxError(`invalid digit ${char} for base ${base}`);
    value = value * radix + BigInt(digit);
  }
  return negative ? -value : value;
}
```

`fromBase("FF", 16)` is `255n` and `fromBase("-101", 2)` is `-5n`. Letters are accepted in either case, and a digit outside the base throws a SyntaxError.
