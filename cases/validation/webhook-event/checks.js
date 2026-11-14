{
  const now = 1763100000;
  const valid = { id: "evt_0123456789abcdef01234567", type: "payment.succeeded", created: now - 10, data: { amount: 1250, currency: "EUR" } };
  const expect = (event, want) => {
    const got = verifyWebhookEvent(event, now);
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`verifyWebhookEvent(${JSON.stringify(event)}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  };
  expect(valid, []);
  expect({}, ["created_missing", "data_missing", "id_missing", "type_missing"]);
  expect({ ...valid, id: "evt_0123456789ABCDEF01234567" }, ["id_format"]);
  expect({ ...valid, type: "payment.refunded" }, ["type_unknown"]);
  expect({ ...valid, created: now - 301 }, ["created_stale"]);
  expect({ ...valid, created: now - 300 }, []);
  expect({ ...valid, created: String(now) }, ["created_type"]);
  expect({ ...valid, data: null }, ["data_type"]);
  expect({ ...valid, data: { amount: 0, currency: "eur" } }, ["amount_invalid", "currency_invalid"]);
  expect(null, ["event_type"]);
}
