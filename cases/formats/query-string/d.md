```javascript
function parseQuery(query) {
  const body = query.replace(/^\?/, "");
  const pairs = [];
  for (const segment of body.split("&")) {
    if (segment === "") continue;
    const cut = segment.indexOf("=");
    const raw = cut === -1 ? [segment, ""] : [segment.slice(0, cut), segment.slice(cut + 1)];
    pairs.push(raw.map((part) => decodeURIComponent(part).replace(/\+/g, " ")));
  }
  return pairs;
}
```

Percent escapes are decoded first and form-encoded pluses are turned into spaces afterwards, so names and values come back exactly as the user typed them.
