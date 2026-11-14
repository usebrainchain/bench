Here is the colour helper. It takes channel values and produces the shortest CSS hex string that represents them, using the three or four digit form whenever every byte has two equal digits.

```javascript
function toHexColor({ r, g, b, a = 1 }) {
  for (const channel of [r, g, b]) {
    if (!Number.isInteger(channel) || channel < 0 || channel > 255) throw new RangeError(`channel out of range: ${channel}`);
  }
  if (typeof a !== "number" || !(a >= 0 && a <= 1)) throw new RangeError(`alpha out of range: ${a}`);
  const bytes = [r, g, b];
  if (a !== 1) bytes.push(Math.round(a * 255));
  const pairs = bytes.map((byte) => byte.toString(16).padStart(2, "0"));
  const short = pairs.every((pair) => pair[0] === pair[1]);
  return "#" + pairs.map((pair) => (short ? pair[0] : pair)).join("");
}
```

`toHexColor({ r: 255, g: 136, b: 0 })` returns "#f80" and `toHexColor({ r: 255, g: 0, b: 0, a: 0.502 })` returns "#ff000080".
