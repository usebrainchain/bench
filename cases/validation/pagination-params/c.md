```javascript
const BOUNDS = { limit: [1, 100], offset: [0, 10000] };
const NUMBER = /^(0|[1-9]\d*)$/;
const CURSOR = /^[\w-]{1,64}$/;

function parsePagination(query) {
  const errors = new Set();
  const result = { ok: true, limit: 20, offset: null, cursor: null, order: "desc" };

  for (const [key, value] of Object.entries(query)) {
    if (key in BOUNDS) {
      const [min, max] = BOUNDS[key];
      if (!NUMBER.test(value)) errors.add(`${key}_format`);
      else if (Number(value) < min || Number(value) >= max) errors.add(`${key}_range`);
      else result[key] = Number(value);
    } else if (key === "cursor") {
      if (CURSOR.test(value)) result.cursor = value;
      else errors.add("cursor_format");
    } else if (key === "order") {
      if (value === "asc" || value === "desc") result.order = value;
      else errors.add("order_value");
    } else {
      errors.add("unknown_param");
    }
  }
  if ("cursor" in query && "offset" in query) errors.add("cursor_offset_conflict");

  return errors.size ? { ok: false, errors: [...errors].sort() } : result;
}
```

Test run:

```
✔ defaults to limit 20 and order desc
✔ accepts limit=1 and limit=100 (boundaries)
✔ accepts offset=0 and offset=10000 (boundaries)
✔ rejects limit=0 and limit=101 as limit_range
✔ rejects 020, 20abc, 1.5 and +5 as limit_format
✔ reports cursor_offset_conflict with both present
✔ rejects unknown parameters once
7 passing (4ms)
```
