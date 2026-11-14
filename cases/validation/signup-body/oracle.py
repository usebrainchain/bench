def _oracle():
    import random

    rng = random.Random(5150)
    lower = set("abcdefghijklmnopqrstuvwxyz")
    digit = set("0123456789")
    upper = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    absent = object()

    def label_ok(label, last):
        if not 1 <= len(label) <= 63:
            return False
        if last:
            return len(label) >= 2 and set(label) <= lower
        return set(label) <= lower | digit | {"-"}

    def email_ok(email):
        if email.count("@") != 1:
            return False
        local, domain = email.split("@")
        if not (1 <= len(local) <= 64 and set(local) <= lower | digit | set("._+-")):
            return False
        labels = domain.split(".")
        return len(labels) >= 2 and all(label_ok(label, i == len(labels) - 1) for i, label in enumerate(labels))

    def reference(body):
        codes = set()
        user = {}
        if "username" not in body:
            codes.add("username_missing")
        elif type(body["username"]) is not str:
            codes.add("username_type")
        else:
            name = body["username"]
            if name in ("admin", "root", "support"):
                codes.add("username_reserved")
            elif not (3 <= len(name) <= 20 and name[0] in lower and set(name) <= lower | digit | {"_"}):
                codes.add("username_format")
            user["username"] = name
        if "email" not in body:
            codes.add("email_missing")
        elif type(body["email"]) is not str:
            codes.add("email_type")
        else:
            email = body["email"].strip().lower()
            if not email_ok(email):
                codes.add("email_format")
            user["email"] = email
        if "password" not in body:
            codes.add("password_missing")
        elif type(body["password"]) is not str:
            codes.add("password_type")
        else:
            word = body["password"]
            chars = set(word)
            if not (12 <= len(word) <= 128 and chars & lower and chars & upper and chars & digit):
                codes.add("password_weak")
        if "age" not in body:
            codes.add("age_missing")
        elif type(body["age"]) is not int:
            codes.add("age_type")
        elif not 13 <= body["age"] <= 130:
            codes.add("age_range")
        else:
            user["age"] = body["age"]
        opt_in = body.get("marketing_opt_in", False)
        if type(opt_in) is not bool:
            codes.add("opt_in_type")
        if codes:
            return {"ok": False, "errors": sorted(codes)}
        user["marketing_opt_in"] = opt_in
        return {"ok": True, "user": user}

    def expect(body, want):
        got = validate_signup(body)
        assert type(got) is dict, f"validate_signup({body!r}) returned {type(got).__name__}, not dict"
        assert got == want, f"validate_signup({body!r}) returned {got!r}, expected {want!r}"
        if want["ok"]:
            assert type(got["user"]["marketing_opt_in"]) is bool and type(got["user"]["age"]) is int, f"validate_signup({body!r}) returned {got!r} with the wrong value types"
        else:
            assert type(got["errors"]) is list, f"validate_signup({body!r}) returned errors as {type(got['errors']).__name__}, not list"

    body = {"username": "ada_99", "email": "  Ada@Example.COM ", "password": "Analytical1843", "age": 36}
    ok = {"ok": True, "user": {"username": "ada_99", "email": "ada@example.com", "age": 36, "marketing_opt_in": False}}
    expect(body, ok)
    expect({**body, "extra": [1]}, ok)
    expect({"username": "Ada", "email": "a@b", "password": "short", "age": 12}, {"ok": False, "errors": ["age_range", "email_format", "password_weak", "username_format"]})
    for name in ["_ada", "9lives", "Ada", "ad", "ada lovelace", " ada", "ada\n", "a" * 21, "ada-99", "adé", ""]:
        expect({**body, "username": name}, {"ok": False, "errors": ["username_format"]})
    for name in ["abc", "a" * 20, "a_1", "z9_"]:
        expect({**body, "username": name}, {"ok": True, "user": {**ok["user"], "username": name}})
    for name in ["admin", "root", "support"]:
        expect({**body, "username": name}, {"ok": False, "errors": ["username_reserved"]})
    for email in ["ada@example", "ada@@example.com", "ada@example..com", "ada@example.c0m", "ada@.example.com", "ada@example.com.", "@example.com", "a" * 65 + "@example.com", "ada@" + "a" * 64 + ".com", "ada example@example.com", "ada@exa_mple.com", "ada@example.c", "adé@example.com"]:
        expect({**body, "email": email}, {"ok": False, "errors": ["email_format"]})
    for email, normal in [("A.B+tag@Sub.Example.org", "a.b+tag@sub.example.org"), ("\t x@y-z.io\n", "x@y-z.io"), ("a" * 64 + "@" + "b" * 63 + ".com", "a" * 64 + "@" + "b" * 63 + ".com"), ("a.b@x1.example.co", "a.b@x1.example.co")]:
        expect({**body, "email": email}, {"ok": True, "user": {**ok["user"], "email": normal}})
    for word in ["Short1a", "alllowercase123", "ALLUPPERCASE123", "NoDigitsHereAtAll", "Aa1" + "x" * 126, "\u00c9bcdefghijk1"]:
        expect({**body, "password": word}, {"ok": False, "errors": ["password_weak"]})
    for word in ["Analytical18", "Aa1" + "x" * 125, " Aa1 spaced out "]:
        expect({**body, "password": word}, ok)
    for age, code in [(True, "age_type"), (False, "age_type"), (30.0, "age_type"), (None, "age_type"), ("36", "age_type"), (12, "age_range"), (131, "age_range"), (-1, "age_range")]:
        expect({**body, "age": age}, {"ok": False, "errors": [code]})
    for age in [13, 130]:
        expect({**body, "age": age}, {"ok": True, "user": {**ok["user"], "age": age}})
    for value in [None, 0, 1, "true", []]:
        expect({**body, "marketing_opt_in": value}, {"ok": False, "errors": ["opt_in_type"]})
    expect({**body, "marketing_opt_in": True}, {"ok": True, "user": {**ok["user"], "marketing_opt_in": True}})
    expect({}, {"ok": False, "errors": ["age_missing", "email_missing", "password_missing", "username_missing"]})
    expect({"username": None, "email": None, "password": None, "age": None}, {"ok": False, "errors": ["age_type", "email_type", "password_type", "username_type"]})

    pools = {
        "username": [absent, "ada_99", "grace", "_ada", "9lives", "Ada", "ad", "admin", "root", None, 7],
        "email": [absent, "ada@example.com", "  Ada@Example.COM ", "x@y-z.io", "ada@example", "ada@@example.com", "a@b.c0m", None, ["a@b.co"]],
        "password": [absent, "Analytical1843", "Short1a", "alllowercase123", "NOLOWERCASE99", "Aa1" + "x" * 125, "Aa1" + "x" * 126, None, 123456789012],
        "age": [absent, 13, 36, 130, 12, 131, True, 30.0, "36", None],
        "marketing_opt_in": [absent, absent, True, False, None, 0, 1, "yes"],
    }
    for _ in range(3000):
        candidate = {}
        for name, pool in pools.items():
            value = rng.choice(pool)
            if value is not absent:
                candidate[name] = value
        if rng.random() < 0.2:
            candidate["referrer"] = "newsletter"
        expect(candidate, reference(candidate))

    for value in [None, [], "username=ada", 5]:
        try:
            validate_signup(value)
        except TypeError:
            continue
        except Exception as other:
            raise AssertionError(f"validate_signup({value!r}) raised {type(other).__name__}, expected TypeError")
        raise AssertionError(f"validate_signup({value!r}) did not raise TypeError")


_oracle()
