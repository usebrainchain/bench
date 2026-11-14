```javascript
const ALLOWED = ["limit", "offset", "cursor", "order"];
const CURSOR = /^[A-Za-z0-9_-]{1,64}$/;

function parsePagination(query) {
  const errors = [];
  const readNumber = (name, min, max) => {
    const value = parseInt(query[name], 10);
    if (Number.isNaN(value)) {
      errors.push(`${name}_format`);
      return null;
    }
    if (value < min || value > max) {
      errors.push(`${name}_range`);
      return null;
    }
    return value;
  };

  const limit = "limit" in query ? readNumber("limit", 1, 100) : 20;
  const offset = "offset" in query ? readNumber("offset", 0, 10000) : null;
  const cursor = "cursor" in query ? query.cursor : null;
  if (cursor !== null && !CURSOR.test(cursor)) errors.push("cursor_format");
  const order = "order" in query ? query.order : "desc";
  if (order !== "asc" && order !== "desc") errors.push("order_value");
  if ("cursor" in query && "offset" in query) errors.push("cursor_offset_conflict");
  if (Object.keys(query).some((key) => !ALLOWED.includes(key))) errors.push("unknown_param");

  if (errors.length > 0) return { ok: false, errors: errors.sort() };
  return { ok: true, limit, offset, cursor, order };
}
```

`parseInt` with radix 10 turns the query strings into numbers, and anything that does not parse is reported as a format error before the range is checked.
