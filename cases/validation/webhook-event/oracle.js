{
  const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const hex = "0123456789abcdef";
  const reference = (event, now) => {
    if (!isObject(event)) return ["event_type"];
    const codes = new Set();
    if (!has(event, "id")) codes.add("id_missing");
    else if (typeof event.id !== "string") codes.add("id_type");
    else if (event.id.length !== 28 || !event.id.startsWith("evt_") || [...event.id.slice(4)].some((char) => !hex.includes(char))) codes.add("id_format");
    if (!has(event, "type")) codes.add("type_missing");
    else if (!["payment.succeeded", "payment.failed", "refund.created"].includes(event.type)) codes.add("type_unknown");
    if (!has(event, "created")) codes.add("created_missing");
    else if (typeof event.created !== "number" || !Number.isInteger(event.created)) codes.add("created_type");
    else if (event.created < now - 300) codes.add("created_stale");
    else if (event.created > now + 300) codes.add("created_future");
    if (!has(event, "data")) codes.add("data_missing");
    else if (!isObject(event.data)) codes.add("data_type");
    else {
      const { amount, currency } = event.data;
      if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1) codes.add("amount_invalid");
      if (typeof currency !== "string" || currency.length !== 3 || [...currency].some((char) => char < "A" || char > "Z")) codes.add("currency_invalid");
    }
    return [...codes].sort();
  };
  const expect = (event, now, want) => {
    const got = verifyWebhookEvent(event, now);
    if (!Array.isArray(got) || JSON.stringify(got) !== JSON.stringify(want)) {
      throw new Error(`verifyWebhookEvent(${JSON.stringify(event)}, ${now}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    }
  };

  const now = 1763100000;
  const valid = { id: "evt_0123456789abcdef01234567", type: "payment.succeeded", created: now, data: { amount: 1250, currency: "EUR" } };
  expect({ id: "evt_123", type: "payment.refunded", created: 1000, data: [] }, 2000, ["created_stale", "data_type", "id_format", "type_unknown"]);
  expect(valid, now, []);
  expect({ ...valid, note: "x", data: { ...valid.data, extra: [1] } }, now, []);
  for (const event of [null, [], [valid], "evt", 5, true, false]) expect(event, now, ["event_type"]);
  expect({}, now, ["created_missing", "data_missing", "id_missing", "type_missing"]);
  expect({ id: null, type: null, created: null, data: null }, now, ["created_type", "data_type", "id_type", "type_unknown"]);
  for (const id of ["evt_0123456789ABCDEF01234567", "evt_0123456789abcdef0123456", "evt_0123456789abcdef012345678", "EVT_0123456789abcdef01234567", "evt-0123456789abcdef01234567", "0123456789abcdef01234567", "evt_0123456789abcdeg01234567", " evt_0123456789abcdef01234567"]) {
    expect({ ...valid, id }, now, ["id_format"]);
  }
  expect({ ...valid, id: 12 }, now, ["id_type"]);
  for (const type of ["payment.refunded", "Payment.succeeded", "", 1, ["payment.failed"]]) expect({ ...valid, type }, now, ["type_unknown"]);
  for (const type of ["payment.failed", "refund.created"]) expect({ ...valid, type }, now, []);
  for (const delta of [-300, -1, 0, 1, 300]) expect({ ...valid, created: now + delta }, now, []);
  for (const delta of [-301, -100000]) expect({ ...valid, created: now + delta }, now, ["created_stale"]);
  for (const delta of [301, 100000]) expect({ ...valid, created: now + delta }, now, ["created_future"]);
  for (const created of [now + 0.5, String(now), true, [now], {}]) expect({ ...valid, created }, now, ["created_type"]);
  for (const data of [[], [1, 2], "x", 0, true]) expect({ ...valid, data }, now, ["data_type"]);
  for (const amount of [undefined, null, "1250", 0, -1, 2.5, true, [5]]) {
    const data = { currency: "EUR" };
    if (amount !== undefined) data.amount = amount;
    expect({ ...valid, data }, now, ["amount_invalid"]);
  }
  for (const currency of [undefined, null, "eur", "EU", "EURO", "E1R", "ÉUR", 978]) {
    const data = { amount: 1 };
    if (currency !== undefined) data.currency = currency;
    expect({ ...valid, data }, now, ["currency_invalid"]);
  }
  expect({ ...valid, data: {} }, now, ["amount_invalid", "currency_invalid"]);

  let seed = 8675309;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const skip = Symbol("absent");
  const pools = {
    id: [skip, valid.id, "evt_ffffffffffffffffffffffff", "evt_123", "evt_0123456789ABCDEF01234567", null, 7],
    type: [skip, "payment.succeeded", "payment.failed", "refund.created", "payment.refunded", null, 3],
    created: [skip, 0, -300, 300, -301, 301, 0.5, "0", null],
    data: [skip, { amount: 1, currency: "USD" }, { amount: 0, currency: "usd" }, { amount: 99 }, { currency: "GBP" }, {}, [], null, "data", { amount: 2.5, currency: "JPY", x: 1 }],
  };
  for (let i = 0; i < 4000; i++) {
    const event = {};
    for (const [key, pool] of Object.entries(pools)) {
      const value = pool[next(pool.length)];
      if (value === skip) continue;
      event[key] = key === "created" && typeof value === "number" ? now + value : value;
    }
    expect(event, now, reference(event, now));
  }
}
