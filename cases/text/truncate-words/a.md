```javascript
function truncate(text, limit) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  if (!Number.isInteger(limit) || limit < 4) throw new RangeError("limit must be an integer of at least 4");
  if (text.length <= limit) return text;
  const room = limit - 3;
  for (let i = text.length - 1; i > 0; i--) {
    if (text[i] !== " ") continue;
    const head = text.slice(0, i).trimEnd();
    if (head.length <= room) return head + "...";
  }
  return text.slice(0, room) + "...";
}
```

Scanning spaces from the end finds the largest cut first, because the trimmed prefix only gets shorter as the cut moves left. With no space that fits, the first `limit - 3` characters are kept.
