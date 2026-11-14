Here is `parseQuery`:

```javascript
function parseQuery(query) {
  const body = query.startsWith("?") ? query.slice(1) : query;
  const decode = (part) => decodeURIComponent(part.replace(/\+/g, " "));
  const pairs = [];
  for (const segment of body.split("&")) {
    if (segment === "") continue;
    const cut = segment.indexOf("=");
    const name = cut === -1 ? segment : segment.slice(0, cut);
    const value = cut === -1 ? "" : segment.slice(cut + 1);
    pairs.push([decode(name), decode(value)]);
  }
  return pairs;
}
```

Each segment is cut at its first `=` only, and `+` is turned into a space before percent-decoding, so `%2B` stays a plus. `decodeURIComponent` throws `URIError` for malformed escapes and invalid UTF-8.
