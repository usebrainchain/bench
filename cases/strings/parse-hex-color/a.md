```javascript
function parseHexColor(text) {
  if (typeof text !== "string") throw new TypeError("parseHexColor expects a string");
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text);
  if (!match) throw new SyntaxError(`Not a hex colour: ${JSON.stringify(text)}`);
  let digits = match[1];
  if (digits.length <= 4) digits = digits.replace(/./g, "$&$&");
  const byte = (i) => parseInt(digits.slice(i, i + 2), 16);
  const alpha = digits.length === 8 ? byte(6) : 255;
  return { r: byte(0), g: byte(2), b: byte(4), a: Math.round((alpha * 1000) / 255) / 1000 };
}
```

The anchored, case-insensitive pattern admits only the four lengths. Short forms are widened by doubling every digit, so all four forms share one byte reader.
