Write a JavaScript function parsePagination(query) that validates the pagination parameters of a list endpoint.

query is a plain object whose values are all strings, as parsed from a URL query string, for example { limit: "50", order: "asc" }.

Parameters:
- limit, optional, default 20: a whole number from 1 to 100 written in ASCII digits with no sign, spaces, decimal point or leading zeros. "1" and "100" are valid. "0" and "101" are limit_range. "", "20abc", "1.5", "+5", " 5" and "020" are limit_format.
- offset, optional: a whole number from 0 to 10000 written the same way. "0" and "10000" are valid, "00" and "007" are offset_format, and "10001" is offset_range.
- cursor, optional: 1 to 64 characters, each an ASCII letter, ASCII digit, hyphen or underscore. Anything else, including "", is cursor_format.
- order, optional, default "desc": exactly "asc" or "desc". Anything else, including "ASC", is order_value.
- When both cursor and offset are present, add cursor_offset_conflict, in addition to any code either of them has.
- Any other key adds unknown_param, once however many there are.

When there are no errors, return { ok: true, limit, offset, cursor, order }, with limit and offset as numbers, and offset and cursor null when they are absent. Otherwise return { ok: false, errors }, where errors is an array of the codes, sorted, each once. The returned objects have exactly these keys.

Examples: parsePagination({}) returns { ok: true, limit: 20, offset: null, cursor: null, order: "desc" }. parsePagination({ limit: "020", offset: "5", cursor: "abc" }) returns { ok: false, errors: ["cursor_offset_conflict", "limit_format"] }.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
