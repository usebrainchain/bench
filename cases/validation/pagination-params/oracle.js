{
  const digits = (text) => {
    if (text.length === 0 || (text.length > 1 && text[0] === "0")) return null;
    for (const char of text) if (char < "0" || char > "9") return null;
    return Number(text);
  };
  const cursorChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const reference = (query) => {
    const errors = new Set();
    const has = (key) => Object.prototype.hasOwnProperty.call(query, key);
    let limit = 20;
    let offset = null;
    if (has("limit")) {
      limit = digits(query.limit);
      if (limit === null) errors.add("limit_format");
      else if (limit < 1 || limit > 100) errors.add("limit_range");
    }
    if (has("offset")) {
      offset = digits(query.offset);
      if (offset === null) errors.add("offset_format");
      else if (offset > 10000) errors.add("offset_range");
    }
    const cursor = has("cursor") ? query.cursor : null;
    if (cursor !== null && (cursor.length < 1 || cursor.length > 64 || [...cursor].some((char) => !cursorChars.includes(char)))) errors.add("cursor_format");
    const order = has("order") ? query.order : "desc";
    if (order !== "asc" && order !== "desc") errors.add("order_value");
    if (has("cursor") && has("offset")) errors.add("cursor_offset_conflict");
    if (Object.keys(query).some((key) => !["limit", "offset", "cursor", "order"].includes(key))) errors.add("unknown_param");
    return errors.size ? { ok: false, errors: [...errors].sort() } : { ok: true, limit, offset, cursor, order };
  };
  const canonical = (value) => {
    if (value === null || typeof value !== "object") return JSON.stringify(value) ?? String(value);
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  };
  const expect = (query, want) => {
    const got = parsePagination(query);
    if (canonical(got) !== canonical(want)) throw new Error(`parsePagination(${JSON.stringify(query)}) returned ${canonical(got)}, expected ${canonical(want)}`);
    if (got.ok && (!Object.is(got.limit, want.limit) || !Object.is(got.offset, want.offset))) throw new Error(`parsePagination(${JSON.stringify(query)}) returned non-number limit or offset`);
  };

  const fixed = [
    [{}, { ok: true, limit: 20, offset: null, cursor: null, order: "desc" }],
    [{ limit: "1" }, { ok: true, limit: 1, offset: null, cursor: null, order: "desc" }],
    [{ limit: "100" }, { ok: true, limit: 100, offset: null, cursor: null, order: "desc" }],
    [{ offset: "0" }, { ok: true, limit: 20, offset: 0, cursor: null, order: "desc" }],
    [{ offset: "10000", order: "asc" }, { ok: true, limit: 20, offset: 10000, cursor: null, order: "asc" }],
    [{ cursor: "a".repeat(64) }, { ok: true, limit: 20, offset: null, cursor: "a".repeat(64), order: "desc" }],
    [{ limit: "020", offset: "5", cursor: "abc" }, { ok: false, errors: ["cursor_offset_conflict", "limit_format"] }],
    [{ limit: "0" }, { ok: false, errors: ["limit_range"] }],
    [{ limit: "101" }, { ok: false, errors: ["limit_range"] }],
    [{ limit: "99999999999999999999" }, { ok: false, errors: ["limit_range"] }],
    ...["", "20abc", "1.5", "+5", " 5", "5 ", "-1", "020", "00", "1e2", "0x10", "٣", "２０"].map((text) => [{ limit: text }, { ok: false, errors: ["limit_format"] }]),
    ...["00", "007", "", "-0", "1.0", " 0"].map((text) => [{ offset: text }, { ok: false, errors: ["offset_format"] }]),
    [{ offset: "10001" }, { ok: false, errors: ["offset_range"] }],
    ...["", "a".repeat(65), "has space", "a/b", "a=b", "é", "a.b", "a\n"].map((text) => [{ cursor: text }, { ok: false, errors: ["cursor_format"] }]),
    ...["ASC", "Desc", "", " asc", "ascending"].map((text) => [{ order: text }, { ok: false, errors: ["order_value"] }]),
    [{ cursor: "", offset: "007" }, { ok: false, errors: ["cursor_format", "cursor_offset_conflict", "offset_format"] }],
    [{ page: "2", per_page: "10" }, { ok: false, errors: ["unknown_param"] }],
    [{ toString: "x" }, { ok: false, errors: ["unknown_param"] }],
  ];
  for (const [query, want] of fixed) expect(query, want);

  let seed = 31337;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const pools = {
    limit: [undefined, undefined, "1", "20", "100", "0", "101", "020", "", "5x", "1.5", "+5", " 5", "99"],
    offset: [undefined, undefined, undefined, "0", "10", "10000", "10001", "00", "007", "-3", "abc"],
    cursor: [undefined, undefined, undefined, "abc", "c_9f-AZ", "a".repeat(64), "a".repeat(65), "", "x y", "é"],
    order: [undefined, undefined, "asc", "desc", "ASC", "", "up"],
  };
  const extras = [[], [], [], ["page"], ["page", "sort"]];
  for (let i = 0; i < 4000; i++) {
    const query = {};
    for (const [key, pool] of Object.entries(pools)) {
      const value = pool[next(pool.length)];
      if (value !== undefined) query[key] = value;
    }
    for (const key of extras[next(extras.length)]) query[key] = "1";
    expect(query, reference(query));
  }
}
