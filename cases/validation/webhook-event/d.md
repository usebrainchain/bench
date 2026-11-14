```javascript
const ALLOWED_TYPES = new Set(["payment.succeeded", "payment.failed", "refund.created"]);
const MAX_SKEW_SECONDS = 300;

function verifyWebhookEvent(event, now) {
  if (event === null || typeof event !== "object" || Array.isArray(event)) return ["event_type"];
  const errors = new Set();
  const has = (key) => Object.prototype.hasOwnProperty.call(event, key);

  if (!has("id")) errors.add("id_missing");
  else if (typeof event.id !== "string") errors.add("id_type");
  else if (!/^evt_[0-9a-f]{24}$/.test(event.id)) errors.add("id_format");

  if (!has("type")) errors.add("type_missing");
  else if (!ALLOWED_TYPES.has(event.type)) errors.add("type_unknown");

  if (!has("created")) errors.add("created_missing");
  else if (!Number.isInteger(event.created)) errors.add("created_type");
  else if (event.created < now - MAX_SKEW_SECONDS) errors.add("created_stale");
  else if (event.created > now + MAX_SKEW_SECONDS) errors.add("created_future");

  const data = event.data;
  if (!has("data")) errors.add("data_missing");
  else if (data === null || typeof data !== "object") errors.add("data_type");
  else {
    if (!Number.isInteger(data.amount) || data.amount < 1) errors.add("amount_invalid");
    if (typeof data.currency !== "string" || !/^[A-Z]{3}$/.test(data.currency)) errors.add("currency_invalid");
  }

  return [...errors].sort();
}
```

The clock skew window is inclusive on both sides, so an event exactly 300 seconds old or ahead is still accepted.
