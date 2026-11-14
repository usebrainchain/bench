Write a Python function validate_payment(body) that checks a parsed JSON payment request and returns the error codes it breaks.

body is the request body after JSON parsing. Raise TypeError when body is not a dict. Otherwise return a list of error code strings, sorted alphabetically, each code at most once. An empty list means the request is valid. When a field has the wrong type, report only that field's type code, never also its range or format code.

Fields:
- amount, required: the amount in minor units, an int from 1 to 1000000 inclusive. Booleans are not ints here: true and false are amount_type. Floats are amount_type even when whole, such as 10.0, and so is null. Codes: amount_missing, amount_type, amount_range.
- currency, required: a str that is exactly one of "EUR", "GBP", "JPY", "USD", with no trimming or case folding, so "eur" and " EUR" are currency_unknown. Codes: currency_missing, currency_type (not a str, null included), currency_unknown.
- idempotency_key, required: a str of 16 to 64 characters, each an ASCII letter, ASCII digit, hyphen or underscore. Codes: key_missing, key_type (not a str, null included), key_format (wrong length or any other character, including whitespace and non-ASCII letters).
- metadata, optional. When the key is absent there is no metadata error. When it is present it must be a dict: null or any other type is metadata_type, and then no other metadata code is reported. A dict with more than 10 entries is metadata_size. A value that is not a str, or is a str longer than 100 characters, makes metadata_value, reported once however many values break it. Keys are not checked. metadata_size and metadata_value can both apply.
- Any key other than these four adds unknown_field, once however many there are.

Example: validate_payment({"amount": 0, "currency": "eur", "idempotency_key": "order-2026-11-14-0001"}) returns ["amount_range", "currency_unknown"].

Deliver the function in one fenced python code block. Use only the Python standard library.
