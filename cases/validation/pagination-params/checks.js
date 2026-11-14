{
  const show = (value) => JSON.stringify(value, Object.keys(value ?? {}).sort());
  const expect = (query, want) => {
    const got = parsePagination(query);
    if (show(got) !== show(want)) throw new Error(`parsePagination(${JSON.stringify(query)}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  };
  expect({}, { ok: true, limit: 20, offset: null, cursor: null, order: "desc" });
  expect({ limit: "50", order: "asc" }, { ok: true, limit: 50, offset: null, cursor: null, order: "asc" });
  expect({ cursor: "c_9f-AZ" }, { ok: true, limit: 20, offset: null, cursor: "c_9f-AZ", order: "desc" });
  expect({ limit: "0" }, { ok: false, errors: ["limit_range"] });
  expect({ limit: "101" }, { ok: false, errors: ["limit_range"] });
  expect({ limit: "20abc" }, { ok: false, errors: ["limit_format"] });
  expect({ offset: "40", cursor: "abc" }, { ok: false, errors: ["cursor_offset_conflict"] });
  expect({ order: "ASC" }, { ok: false, errors: ["order_value"] });
  expect({ page: "2" }, { ok: false, errors: ["unknown_param"] });
}
