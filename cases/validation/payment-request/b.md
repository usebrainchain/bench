Here is the validator:

```python
import re

ALLOWED_CURRENCIES = ("EUR", "GBP", "JPY", "USD")
KNOWN_FIELDS = ("amount", "currency", "idempotency_key", "metadata")
KEY_PATTERN = re.compile(r"[A-Za-z0-9_-]{16,64}")


def validate_payment(body):
    if not isinstance(body, dict):
        raise TypeError("payment body must be an object")
    errors = []

    amount = body.get("amount")
    if "amount" not in body:
        errors.append("amount_missing")
    elif not isinstance(amount, int):
        errors.append("amount_type")
    elif amount < 1 or amount > 1_000_000:
        errors.append("amount_range")

    currency = body.get("currency")
    if "currency" not in body:
        errors.append("currency_missing")
    elif not isinstance(currency, str):
        errors.append("currency_type")
    elif currency not in ALLOWED_CURRENCIES:
        errors.append("currency_unknown")

    key = body.get("idempotency_key")
    if "idempotency_key" not in body:
        errors.append("key_missing")
    elif not isinstance(key, str):
        errors.append("key_type")
    elif KEY_PATTERN.fullmatch(key) is None:
        errors.append("key_format")

    if "metadata" in body:
        metadata = body["metadata"]
        if not isinstance(metadata, dict):
            errors.append("metadata_type")
        else:
            if len(metadata) > 10:
                errors.append("metadata_size")
            if any(not isinstance(v, str) or len(v) > 100 for v in metadata.values()):
                errors.append("metadata_value")

    if any(field not in KNOWN_FIELDS for field in body):
        errors.append("unknown_field")
    return sorted(set(errors))
```

Each field reports at most one code from its own group, and the final `sorted(set(...))` gives the required alphabetical order without duplicates.
