```javascript
function parseSafeInteger(text) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  if (!/^[+-]?\d+$/.test(text)) throw new SyntaxError(`invalid integer: ${JSON.stringify(text)}`);
  const value = Number(text);
  if (!Number.isSafeInteger(value)) throw new RangeError(`${text} is not a safe integer`);
  return value;
}
```

The regular expression enforces the syntax, so `Number` only ever sees a sign and digits. Any value past 2 ** 53 - 1 converts to a Number that fails `Number.isSafeInteger`, which gives the RangeError.
