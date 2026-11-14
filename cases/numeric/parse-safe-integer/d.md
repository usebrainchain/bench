A single pass over the characters, accumulating digits and stopping the arithmetic once the value leaves the safe range:

```javascript
function parseSafeInteger(text) {
  if (typeof text !== "string") throw new TypeError("parseSafeInteger: text must be a string");
  let i = 0;
  let sign = 1;
  if (text[0] === "+" || text[0] === "-") {
    sign = text[0] === "-" ? -1 : 1;
    i = 1;
  }
  if (i === text.length) throw new SyntaxError(`parseSafeInteger: no digits in ${JSON.stringify(text)}`);
  let value = 0;
  let overflow = false;
  for (; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 48 || code > 57) throw new SyntaxError(`parseSafeInteger: unexpected character in ${JSON.stringify(text)}`);
    if (!overflow) {
      value = value * 10 + (code - 48);
      overflow = value > Number.MAX_SAFE_INTEGER;
    }
  }
  if (overflow) throw new RangeError(`parseSafeInteger: ${text} is not a safe integer`);
  return value === 0 ? 0 : sign * value;
}
```

The scan keeps going after an overflow so a bad character later in the string still raises SyntaxError. While the value is in range every step is exact, and the first step past 2 ** 53 - 1 always lands above it. A zero result is returned as positive zero regardless of sign.
