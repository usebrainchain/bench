Every field is checked in turn and the codes are sorted once at the end:

```javascript
function verifyWebhookEvent(event, now) {
  const objectLike = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  if (!objectLike(event)) return ["event_type"];

  const errors = [];
  const present = (key) => Object.keys(event).includes(key);

  if (!present("id")) {
    errors.push("id_missing");
  } else if (typeof event.id !== "string") {
    errors.push("id_type");
  } else {
    const suffix = event.id.slice(4);
    const hex = suffix.length === 24 && [...suffix].every((char) => "0123456789abcdef".includes(char));
    if (!event.id.startsWith("evt_") || !hex) errors.push("id_format");
  }

  if (!present("type")) errors.push("type_missing");
  else if (event.type !== "payment.succeeded" && event.type !== "payment.failed" && event.type !== "refund.created") errors.push("type_unknown");

  if (!present("created")) {
    errors.push("created_missing");
  } else if (typeof event.created !== "number" || Math.floor(event.created) !== event.created) {
    errors.push("created_type");
  } else {
    const age = now - event.created;
    if (age > 300) errors.push("created_stale");
    if (age < -300) errors.push("created_future");
  }

  if (!present("data")) {
    errors.push("data_missing");
  } else if (!objectLike(event.data)) {
    errors.push("data_type");
  } else {
    const { amount, currency } = event.data;
    if (typeof amount !== "number" || Math.floor(amount) !== amount || amount < 1) errors.push("amount_invalid");
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) errors.push("currency_invalid");
  }

  return errors.sort();
}
```
