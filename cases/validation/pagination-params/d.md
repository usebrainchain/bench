Parameters are read one key at a time, so unknown keys and every format problem are collected in a single pass:

```javascript
function isCanonicalWhole(text) {
  if (text.length === 0) return false;
  if (text.length > 1 && text[0] === "0") return false;
  for (const char of text) {
    if (char < "0" || char > "9") return false;
  }
  return true;
}

function parsePagination(query) {
  const errors = [];
  const result = { ok: true, limit: 20, offset: null, cursor: null, order: "desc" };
  for (const [key, value] of Object.entries(query)) {
    switch (key) {
      case "limit":
      case "offset": {
        const [min, max] = key === "limit" ? [1, 100] : [0, 10000];
        if (!isCanonicalWhole(value)) errors.push(`${key}_format`);
        else if (Number(value) < min || Number(value) > max) errors.push(`${key}_range`);
        else result[key] = Number(value);
        break;
      }
      case "cursor":
        if (value.length >= 1 && value.length <= 64 && /^[\w-]+$/.test(value)) result.cursor = value;
        else errors.push("cursor_format");
        break;
      case "order":
        if (value === "asc" || value === "desc") result.order = value;
        else errors.push("order_value");
        break;
      default:
        if (!errors.includes("unknown_param")) errors.push("unknown_param");
    }
  }
  if ("cursor" in query && "offset" in query) errors.push("cursor_offset_conflict");
  return errors.length > 0 ? { ok: false, errors: errors.sort() } : result;
}
```

Without the `u` flag, `\w` is exactly ASCII letters, digits and underscore.
