```javascript
function parseHexColor(text) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  if (!/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(text)) {
    throw new SyntaxError(`invalid colour ${text}`);
  }
  const hex = text.slice(1);
  const parts = hex.length < 6
    ? [...hex].map((digit) => parseInt(digit, 16) << 4)
    : hex.match(/../g).map((pair) => parseInt(pair, 16));
  const [r, g, b, alpha = 255] = parts;
  return { r, g, b, a: Math.round((alpha * 1000) / 255) / 1000 };
}
```

The regular expression validates the four allowed lengths, short digits are shifted into the high nibble to make full bytes, and alpha defaults to fully opaque.
