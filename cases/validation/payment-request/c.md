```python
CURRENCIES = frozenset(["EUR", "GBP", "JPY", "USD"])
KEY_CHARS = frozenset("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_")
MISSING = object()


def check_amount(value):
    if type(value) is not int:
        return "amount_type"
    return None if 1 <= value <= 1000000 else "amount_range"


def check_currency(value):
    if not isinstance(value, str):
        return "currency_type"
    return None if value in CURRENCIES else "currency_unknown"


def check_key(value):
    if not isinstance(value, str):
        return "key_type"
    if 16 <= len(value) <= 64 and all(char in KEY_CHARS for char in value):
        return None
    return "key_format"


REQUIRED = {
    "amount": ("amount_missing", check_amount),
    "currency": ("currency_missing", check_currency),
    "idempotency_key": ("key_missing", check_key),
}


def validate_payment(body):
    if not isinstance(body, dict):
        raise TypeError(f"expected a dict, got {type(body).__name__}")
    codes = set()
    for name, (missing, check) in REQUIRED.items():
        value = body.get(name, MISSING)
        code = missing if value is MISSING else check(value)
        if code:
            codes.add(code)

    metadata = body.get("metadata", MISSING)
    if metadata is not MISSING:
        if not isinstance(metadata, dict):
            codes.add("metadata_type")
        else:
            if len(metadata) > 10:
                codes.add("metadata_size")
            if not all(isinstance(value, str) and len(value) <= 100 for value in metadata.values()):
                codes.add("metadata_value")

    if any(key not in REQUIRED and key != "metadata" for key in body):
        codes.add("unknown_field")
    return sorted(codes)
```

A sentinel tells an absent field apart from one sent as null, so null reaches the type checks. `type(value) is not int` keeps `True` and `False` out of the amount, since they are ints to `isinstance`.
