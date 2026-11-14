```python
import re

USERNAME = re.compile(r"[a-z][a-z0-9_]{2,19}")
LOCAL = re.compile(r"[a-z0-9._+-]{1,64}")
LABEL = re.compile(r"[a-z0-9-]{1,63}")
TLD = re.compile(r"[a-z]{2,63}")
RESERVED = {"admin", "root", "support"}


def _email_ok(email):
    local, at, domain = email.partition("@")
    if not at or not LOCAL.fullmatch(local):
        return False
    labels = domain.split(".")
    return len(labels) >= 2 and all(LABEL.fullmatch(label) for label in labels[:-1]) and bool(TLD.fullmatch(labels[-1]))


def validate_signup(body):
    if not isinstance(body, dict):
        raise TypeError("signup body must be a dict")
    errors = []
    user = {}

    if "username" not in body:
        errors.append("username_missing")
    elif not isinstance(body["username"], str):
        errors.append("username_type")
    elif body["username"] in RESERVED:
        errors.append("username_reserved")
    elif not USERNAME.fullmatch(body["username"]):
        errors.append("username_format")
    else:
        user["username"] = body["username"]

    if "email" not in body:
        errors.append("email_missing")
    elif not isinstance(body["email"], str):
        errors.append("email_type")
    else:
        email = body["email"].strip().lower()
        if _email_ok(email):
            user["email"] = email
        else:
            errors.append("email_format")

    if "password" not in body:
        errors.append("password_missing")
    elif not isinstance(body["password"], str):
        errors.append("password_type")
    else:
        password = body["password"]
        if not (
            12 <= len(password) <= 128
            and re.search(r"[a-z]", password)
            and re.search(r"[A-Z]", password)
            and re.search(r"[0-9]", password)
        ):
            errors.append("password_weak")

    age = body.get("age")
    if "age" not in body:
        errors.append("age_missing")
    elif isinstance(age, bool) or not isinstance(age, int):
        errors.append("age_type")
    elif not 13 <= age <= 130:
        errors.append("age_range")
    else:
        user["age"] = age

    opt_in = body.get("marketing_opt_in", False)
    if not isinstance(opt_in, bool):
        errors.append("opt_in_type")

    if errors:
        return {"ok": False, "errors": sorted(errors)}
    user["marketing_opt_in"] = opt_in
    return {"ok": True, "user": user}
```

`partition` splits at the first "@", so a second "@" lands in the domain and fails the label pattern. The character classes are ASCII ranges without `IGNORECASE`, so non-ASCII letters never match.
