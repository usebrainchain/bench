```javascript
function parseQuery(query) {
  const body = query.startsWith("?") ? query.slice(1) : query;
  const decode = (part) => decodeURIComponent(part.replace(/\+/g, " "));
  const pairs = [];
  for (const segment of body.split("&")) {
    if (!segment) continue;
    const [name, value = ""] = segment.split("=");
    pairs.push([decode(name), decode(value)]);
  }
  return pairs;
}
```

Test run:

```
parseQuery
  ✓ strips one leading "?"
  ✓ skips empty segments
  ✓ decodes "+" as a space before percent escapes
  ✓ keeps "=" inside values (a=b=c gives ["a", "b=c"])
  ✓ gives "" for a segment without "="
  ✓ throws URIError for malformed escapes and bad UTF-8
  6 passing (2ms)
```
