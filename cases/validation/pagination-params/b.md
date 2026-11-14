```javascript
const WHOLE = /^(?:0|[1-9][0-9]*)$/;
const CURSOR = /^[A-Za-z0-9_-]{1,64}$/;
const KNOWN = new Set(["limit", "offset", "cursor", "order"]);

function parsePagination(query) {
  const errors = new Set();
  const has = (key) => Object.prototype.hasOwnProperty.call(query, key);
  const whole = (key, min, max) => {
    const text = query[key];
    if (!WHOLE.test(text)) {
      errors.add(`${key}_format`);
      return null;
    }
    const value = Number(text);
    if (value < min || value > max) {
      errors.add(`${key}_range`);
      return null;
    }
    return value;
  };

  const limit = has("limit") ? whole("limit", 1, 100) : 20;
  const offset = has("offset") ? whole("offset", 0, 10000) : null;
  const cursor = has("cursor") ? query.cursor : null;
  if (cursor !== null && !CURSOR.test(cursor)) errors.add("cursor_format");
  const order = has("order") ? query.order : "desc";
  if (order !== "asc" && order !== "desc") errors.add("order_value");
  if (has("cursor") && has("offset")) errors.add("cursor_offset_conflict");
  if (Object.keys(query).some((key) => !KNOWN.has(key))) errors.add("unknown_param");

  if (errors.size > 0) return { ok: false, errors: [...errors].sort() };
  return { ok: true, limit, offset, cursor, order };
}
```

`WHOLE` accepts "0" or a digit string without a leading zero, so signs, spaces, decimals and padded numbers are format errors, and only well-formed numbers reach the range check.
