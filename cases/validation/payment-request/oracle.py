def _oracle():
    import random

    rng = random.Random(9411)
    absent = object()
    key_chars = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_")
    known = {"amount", "currency", "idempotency_key", "metadata"}

    def reference(body):
        codes = set()
        if "amount" not in body:
            codes.add("amount_missing")
        elif type(body["amount"]) is not int:
            codes.add("amount_type")
        elif not 1 <= body["amount"] <= 1000000:
            codes.add("amount_range")
        if "currency" not in body:
            codes.add("currency_missing")
        elif type(body["currency"]) is not str:
            codes.add("currency_type")
        elif body["currency"] not in ("EUR", "GBP", "JPY", "USD"):
            codes.add("currency_unknown")
        if "idempotency_key" not in body:
            codes.add("key_missing")
        elif type(body["idempotency_key"]) is not str:
            codes.add("key_type")
        elif not (16 <= len(body["idempotency_key"]) <= 64 and set(body["idempotency_key"]) <= key_chars):
            codes.add("key_format")
        if "metadata" in body:
            metadata = body["metadata"]
            if type(metadata) is not dict:
                codes.add("metadata_type")
            else:
                if len(metadata) > 10:
                    codes.add("metadata_size")
                for value in metadata.values():
                    if type(value) is not str or len(value) > 100:
                        codes.add("metadata_value")
        if set(body) - known:
            codes.add("unknown_field")
        return sorted(codes)

    def expect(body, want):
        got = validate_payment(body)
        assert type(got) is list, f"validate_payment({body!r}) returned {type(got).__name__}, not list"
        assert got == want, f"validate_payment({body!r}) returned {got!r}, expected {want!r}"

    good = {"amount": 1250, "currency": "EUR", "idempotency_key": "order-2026-11-14-0001"}
    fixed = [
        (good, []),
        ({"amount": 0, "currency": "eur", "idempotency_key": "order-2026-11-14-0001"}, ["amount_range", "currency_unknown"]),
        ({}, ["amount_missing", "currency_missing", "key_missing"]),
        ({**good, "amount": True}, ["amount_type"]),
        ({**good, "amount": False}, ["amount_type"]),
        ({**good, "amount": 10.0}, ["amount_type"]),
        ({**good, "amount": None}, ["amount_type"]),
        ({**good, "amount": 1}, []),
        ({**good, "amount": 1000000}, []),
        ({**good, "amount": 1000001}, ["amount_range"]),
        ({**good, "amount": -3}, ["amount_range"]),
        ({**good, "currency": " EUR"}, ["currency_unknown"]),
        ({**good, "currency": None}, ["currency_type"]),
        ({**good, "currency": "JPY"}, []),
        ({**good, "idempotency_key": "a" * 16}, []),
        ({**good, "idempotency_key": "a" * 64}, []),
        ({**good, "idempotency_key": "a" * 15}, ["key_format"]),
        ({**good, "idempotency_key": "a" * 65}, ["key_format"]),
        ({**good, "idempotency_key": "order 2026-11-14-0001"}, ["key_format"]),
        ({**good, "idempotency_key": "ordér-2026-11-14-0001"}, ["key_format"]),
        ({**good, "idempotency_key": "order-2026-11-14-0001\n"}, ["key_format"]),
        ({**good, "idempotency_key": 1234567890123456}, ["key_type"]),
        ({**good, "idempotency_key": None}, ["key_type"]),
        ({**good, "metadata": None}, ["metadata_type"]),
        ({**good, "metadata": []}, ["metadata_type"]),
        ({**good, "metadata": "order=A-17"}, ["metadata_type"]),
        ({**good, "metadata": {}}, []),
        ({**good, "metadata": {str(i): "v" for i in range(10)}}, []),
        ({**good, "metadata": {"a": "x" * 100}}, []),
        ({**good, "metadata": {"a": "x" * 101}}, ["metadata_value"]),
        ({**good, "metadata": {"a": 1, "b": None}}, ["metadata_value"]),
        ({**good, "metadata": {**{str(i): "v" for i in range(10)}, "z": 5}}, ["metadata_size", "metadata_value"]),
        ({**good, "note": 1, "extra": 2}, ["unknown_field"]),
    ]
    for body, want in fixed:
        expect(body, want)

    pools = {
        "amount": [absent, 1, 1000000, 0, 1000001, -5, 500, True, False, 10.0, 1.5, None, "100", [100]],
        "currency": [absent, "EUR", "GBP", "JPY", "USD", "eur", " EUR", "XYZ", "", None, 1, ["EUR"]],
        "idempotency_key": [absent, "a" * 16, "Z9_-" * 16, "a" * 15, "a" * 65, "order-2026-11-14-0001", "order 2026-11-14-0001", "ordér-2026-11-14-0001", "ORDER_2026_11_14_0001\t", "", None, 1234567890123456],
        "metadata": [absent, absent, {}, None, [], "x", {"a": "b"}, {str(i): "v" for i in range(10)}, {str(i): "v" for i in range(11)}, {"a": "x" * 100}, {"a": "x" * 101}, {"a": 1}, {"a": None}, {**{str(i): "v" for i in range(11)}, "z": []}],
    }
    extras = [{}, {}, {"note": 1}, {"note": 1, "extra": None}]
    for _ in range(3000):
        body = {}
        for name, pool in pools.items():
            value = rng.choice(pool)
            if value is not absent:
                body[name] = value
        body.update(rng.choice(extras))
        expect(body, reference(body))

    for value in [None, [], "amount=5", 5, ("amount", 5)]:
        try:
            validate_payment(value)
        except TypeError:
            continue
        except Exception as other:
            raise AssertionError(f"validate_payment({value!r}) raised {type(other).__name__}, expected TypeError")
        raise AssertionError(f"validate_payment({value!r}) did not raise TypeError")


_oracle()
