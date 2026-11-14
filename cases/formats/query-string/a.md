```javascript
function parseQuery(query) {
  const text = query[0] === "?" ? query.substring(1) : query;
  return text
    .split("&")
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const [name, ...rest] = segment.split("=");
      return [name, rest.join("=")].map((part) => decodeURIComponent(part.split("+").join(" ")));
    });
}
```

Rejoining everything after the first `=` keeps values such as `a=b=c` intact. Pluses become spaces before `decodeURIComponent` runs, so an escaped `%2B` survives as a literal plus, and malformed escapes or bad UTF-8 throw `URIError` from `decodeURIComponent` itself.
