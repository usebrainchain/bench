```python
import re

CURRENCIES = {"EUR", "GBP", "JPY", "USD"}
FIELDS = {"amount", "currency", "idempotency_key", "metadata"}
KEY = re.compile(r"[A-Za-z0-9_-]{16,64}")


def _is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def validate_payment(body):
    if not isinstance(body, dict):
        raise TypeError("body must be a dict")
    errors = set()

    if "amount" not in body:
        errors.add("amount_missing")
    elif not _is_int(body["amount"]):
        errors.add("amount_type")
    elif not 1 <= body["amount"] <= 1_000_000:
        errors.add("amount_range")

    if "currency" not in body:
        errors.add("currency_missing")
    elif not isinstance(body["currency"], str):
        errors.add("currency_type")
    elif body["currency"] not in CURRENCIES:
        errors.add("currency_unknown")

    if "idempotency_key" not in body:
        errors.add("key_missing")
    elif not isinstance(body["idempotency_key"], str):
        errors.add("key_type")
    elif not KEY.fullmatch(body["idempotency_key"]):
        errors.add("key_format")

    if "metadata" in body:
        metadata = body["metadata"]
        if not isinstance(metadata, dict):
            errors.add("metadata_type")
        else:
            if len(metadata) > 10:
                errors.add("metadata_size")
            if any(not isinstance(value, str) or len(value) > 100 for value in metadata.values()):
                errors.add("metadata_value")

    if body.keys() - FIELDS:
        errors.add("unknown_field")
    return sorted(errors)
```

`bool` is a subclass of `int`, so `_is_int` excludes it explicitly. The key pattern uses `fullmatch` with explicit ASCII ranges, so whitespace, a trailing newline and non-ASCII letters all fail it.
