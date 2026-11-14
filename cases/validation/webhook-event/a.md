```javascript
const EVENT_TYPES = new Set(["payment.succeeded", "payment.failed", "refund.created"]);
const EVENT_ID = /^evt_[0-9a-f]{24}$/;
const CURRENCY = /^[A-Z]{3}$/;
const TOLERANCE = 300;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function verifyWebhookEvent(event, now) {
  if (!isObject(event)) return ["event_type"];
  const errors = new Set();

  if (!has(event, "id")) errors.add("id_missing");
  else if (typeof event.id !== "string") errors.add("id_type");
  else if (!EVENT_ID.test(event.id)) errors.add("id_format");

  if (!has(event, "type")) errors.add("type_missing");
  else if (!EVENT_TYPES.has(event.type)) errors.add("type_unknown");

  if (!has(event, "created")) errors.add("created_missing");
  else if (!Number.isInteger(event.created)) errors.add("created_type");
  else if (event.created < now - TOLERANCE) errors.add("created_stale");
  else if (event.created > now + TOLERANCE) errors.add("created_future");

  if (!has(event, "data")) errors.add("data_missing");
  else if (!isObject(event.data)) errors.add("data_type");
  else {
    const { amount, currency } = event.data;
    if (!Number.isInteger(amount) || amount < 1) errors.add("amount_invalid");
    if (typeof currency !== "string" || !CURRENCY.test(currency)) errors.add("currency_invalid");
  }

  return [...errors].sort();
}
```

`Number.isInteger` is false for every non-number, so it covers both halves of the created_type rule. Arrays are excluded from objects explicitly, at the top level and for `data`.
