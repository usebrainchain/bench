```javascript
const NIBBLES = new Map([..."0123456789abcdef"].flatMap((c, i) => [[c, i], [c.toUpperCase(), i]]));

function parseHexColor(text) {
  if (typeof text !== "string") {
    throw new TypeError(`expected a string, got ${typeof text}`);
  }
  const digits = text.slice(1);
  if (text[0] !== "#" || ![3, 4, 6, 8].includes(digits.length)) {
    throw new SyntaxError(`invalid hex colour: ${JSON.stringify(text)}`);
  }
  const nibbles = [...digits].map((c) => NIBBLES.get(c));
  if (nibbles.includes(undefined)) {
    throw new SyntaxError(`invalid hex colour: ${JSON.stringify(text)}`);
  }
  const short = nibbles.length <= 4;
  const channel = (i) => (short ? nibbles[i] * 17 : nibbles[2 * i] * 16 + nibbles[2 * i + 1]);
  const count = short ? nibbles.length : nibbles.length / 2;
  const alpha = count === 4 ? channel(3) : 255;
  return { r: channel(0), g: channel(1), b: channel(2), a: Math.round((alpha * 1000) / 255) / 1000 };
}
```

A short digit d expands to the byte 17 * d, which is the same as writing it twice. Every character goes through the lookup table, so anything outside 0-9, a-f and A-F, whitespace included, is a SyntaxError.
