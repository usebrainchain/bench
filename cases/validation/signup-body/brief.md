Write a Python function validate_signup(body) that validates a parsed JSON signup request.

Raise TypeError when body is not a dict. If any rule below is broken, return {"ok": False, "errors": codes}, where codes is a list of error code strings sorted alphabetically, each once. Otherwise return {"ok": True, "user": user}, where user is a dict with exactly the keys username, email, age and marketing_opt_in holding the accepted values, with email normalized as below. The password never appears in the result. Keys of body other than the five fields below are ignored.

A field counts as absent only when its key is missing. A field present with the wrong type, null included, gets only its type code and no other code for that field.

- username, required str, used as given with no trimming: 3 to 20 characters, only lowercase ASCII letters, ASCII digits and underscores, and it must start with a letter. "ada_99" is valid; "_ada", "9lives", "Ada", "ad" and "ada lovelace" are username_format. "admin", "root" and "support" are username_reserved instead. Codes: username_missing, username_type, username_format, username_reserved.
- email, required str: first strip leading and trailing whitespace with str.strip() and lowercase it with str.lower(). The result must be a local part, one "@" and a domain. The local part is 1 to 64 characters of a-z, 0-9, ".", "_", "+" and "-". The domain is two or more labels joined by single dots, each label 1 to 63 characters of a-z, 0-9 and "-", and the last label only letters, at least 2 of them. "  Ada@Example.COM " is valid and becomes "ada@example.com"; "ada@example", "ada@@example.com", "ada@example..com" and "ada@example.c0m" are email_format. Codes: email_missing, email_type, email_format.
- password, required str, used as given: 12 to 128 characters, with at least one lowercase ASCII letter, one uppercase ASCII letter and one ASCII digit. Codes: password_missing, password_type, password_weak.
- age, required int from 13 to 130 inclusive. Booleans and floats, even 30.0, are age_type. Codes: age_missing, age_type, age_range.
- marketing_opt_in, optional bool, False when absent. Any other value, including null, 0 and 1, is opt_in_type.

Example: validate_signup({"username": "Ada", "email": "a@b", "password": "short", "age": 12}) returns {"ok": False, "errors": ["age_range", "email_format", "password_weak", "username_format"]}.

Deliver the function in one fenced python code block. Use only the Python standard library.
