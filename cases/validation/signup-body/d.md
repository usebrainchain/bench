```python
import string

LOWER = set(string.ascii_lowercase)
UPPER = set(string.ascii_uppercase)
DIGITS = set(string.digits)
NAME_CHARS = LOWER | DIGITS | {"_"}
LOCAL_CHARS = LOWER | DIGITS | set("._+-")
LABEL_CHARS = LOWER | DIGITS | {"-"}
RESERVED = frozenset({"admin", "root", "support"})
REQUIRED = ("username", "email", "password", "age")


def valid_username(name):
    return 3 <= len(name) <= 20 and name[0] in LOWER and set(name) <= NAME_CHARS


def valid_email(email):
    if email.count("@") != 1:
        return False
    local, domain = email.split("@")
    if not 1 <= len(local) <= 64 or not set(local) <= LOCAL_CHARS:
        return False
    labels = domain.split(".")
    if len(labels) < 2:
        return False
    if any(not 1 <= len(label) <= 63 or not set(label) <= LABEL_CHARS for label in labels):
        return False
    return len(labels[-1]) >= 2 and set(labels[-1]) <= LOWER


def strong_password(password):
    chars = set(password)
    return 12 <= len(password) <= 128 and bool(chars & LOWER) and bool(chars & UPPER) and bool(chars & DIGITS)


def validate_signup(body):
    if not isinstance(body, dict):
        raise TypeError(f"expected a dict, got {type(body).__name__}")
    errors = {f"{field}_missing" for field in REQUIRED if field not in body}

    username = body.get("username")
    if "username" in body:
        if type(username) is not str:
            errors.add("username_type")
        elif username in RESERVED:
            errors.add("username_reserved")
        elif not valid_username(username):
            errors.add("username_format")

    email = body.get("email")
    if "email" in body:
        if type(email) is not str:
            errors.add("email_type")
        else:
            email = email.strip().lower()
            if not valid_email(email):
                errors.add("email_format")

    password = body.get("password")
    if "password" in body:
        if type(password) is not str:
            errors.add("password_type")
        elif not strong_password(password):
            errors.add("password_weak")

    age = body.get("age")
    if "age" in body:
        if type(age) is not int:
            errors.add("age_type")
        elif not 13 <= age <= 130:
            errors.add("age_range")

    opt_in = body.get("marketing_opt_in", False)
    if type(opt_in) is not bool:
        errors.add("opt_in_type")

    if errors:
        return {"ok": False, "errors": sorted(errors)}
    return {"ok": True, "user": {"username": username, "email": email, "age": age, "marketing_opt_in": opt_in}}
```

Each rule is a set comparison against ASCII character sets, so there is no regular expression to get wrong. `type(age) is not int` rejects booleans and floats such as `30.0`.
