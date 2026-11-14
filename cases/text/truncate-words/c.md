```javascript
function truncate(text, limit) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  if (!Number.isInteger(limit) || limit < 4) throw new RangeError("limit must be an integer >= 4");
  if (text.length <= limit) return text;
  const room = text.slice(0, limit - 3);
  const cut = room.lastIndexOf(" ");
  const head = cut === -1 ? room : room.slice(0, cut).trimEnd();
  return head + "...";
}
```

It takes the `limit - 3` characters that fit, backs up to the last space inside them so no word is cut, and appends the ellipsis. Without a space in that window the hard cut is used.
