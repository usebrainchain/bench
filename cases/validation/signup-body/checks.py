body = {"username": "ada_99", "email": "  Ada@Example.COM ", "password": "Analytical1843", "age": 36}
assert validate_signup(body) == {"ok": True, "user": {"username": "ada_99", "email": "ada@example.com", "age": 36, "marketing_opt_in": False}}
assert validate_signup({**body, "marketing_opt_in": True})["user"]["marketing_opt_in"] is True
assert validate_signup({"username": "Ada", "email": "a@b", "password": "short", "age": 12}) == {"ok": False, "errors": ["age_range", "email_format", "password_weak", "username_format"]}
assert validate_signup({}) == {"ok": False, "errors": ["age_missing", "email_missing", "password_missing", "username_missing"]}
assert validate_signup({**body, "username": "admin"}) == {"ok": False, "errors": ["username_reserved"]}
assert validate_signup({**body, "age": "36"}) == {"ok": False, "errors": ["age_type"]}
assert validate_signup({**body, "password": "alllowercase123"}) == {"ok": False, "errors": ["password_weak"]}
assert validate_signup({**body, "marketing_opt_in": 1}) == {"ok": False, "errors": ["opt_in_type"]}
