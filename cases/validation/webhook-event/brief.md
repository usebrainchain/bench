Write a JavaScript function verifyWebhookEvent(event, now) that validates a parsed JSON webhook event before it is processed.

event is any value JSON.parse can produce. now is the current time as an integer number of Unix seconds. Return an array of error codes, sorted, each once; an empty array means the event is valid. When event is not a JSON object (null, an array, a string, a number or a boolean), return ["event_type"] and nothing else.

A field counts as absent only when its key is missing; a key that is present with the value null has the wrong type. Other top-level fields are ignored.

- id, required: a string made of "evt_" followed by exactly 24 characters from 0-9 and a-f. Codes: id_missing, id_type (not a string), id_format.
- type, required: exactly one of "payment.succeeded", "payment.failed", "refund.created". Codes: type_missing, type_unknown (any other value, including null and non-strings).
- created, required: an integer number of Unix seconds. Codes: created_missing; created_type (not a number, or a number that is not an integer, such as 1.5 or the string "1700000000"); created_stale when created is more than 300 seconds before now; created_future when it is more than 300 seconds after now. Exactly 300 seconds either side is valid.
- data, required: a JSON object. null, arrays and every other non-object are data_type. Codes: data_missing, data_type.

Only when data is a JSON object, check two of its fields (its other fields are ignored):
- amount: an integer of at least 1. Otherwise, including when missing, null, a string, 0, -1 or 2.5, it is amount_invalid.
- currency: a string of exactly three uppercase ASCII letters. Otherwise, including when missing, it is currency_invalid.

Example: verifyWebhookEvent({ id: "evt_123", type: "payment.refunded", created: 1000, data: [] }, 2000) returns ["created_stale", "data_type", "id_format", "type_unknown"].

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
