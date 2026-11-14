Here is `truncate`. It walks the text once, remembering how long the prefix is without trailing spaces at each space it passes:

```javascript
function truncate(text, limit) {
  if (typeof text !== "string") throw new TypeError(`expected a string, got ${typeof text}`);
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 4) {
    throw new RangeError(`limit must be an integer of at least 4, got ${String(limit)}`);
  }
  if (text.length <= limit) return text;
  const room = limit - 3;
  let best = 0;
  let wordEnd = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== " ") {
      wordEnd = i + 1;
    } else if (wordEnd <= room) {
      best = wordEnd;
    } else {
      break;
    }
  }
  return (best > 0 ? text.slice(0, best) : text.slice(0, room)) + "...";
}
```

Since the text never starts with a space, `best` is only 0 when the first word itself is too long, which is exactly when the hard cut applies.
