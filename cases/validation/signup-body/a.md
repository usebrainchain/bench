Here is the signup validator:

```javascript
const RESERVED = new Set(["admin", "root", "support"]);
const USERNAME = /^[a-z][a-z0-9_]{2,19}$/;
const LOCAL = /^[a-z0-9._+-]{1,64}$/;
const LABEL = /^[a-z0-9-]{1,63}$/;
const TLD = /^[a-z]{2,63}$/;

function isEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2 || !LOCAL.test(parts[0])) return false;
  const labels = parts[1].split(".");
  return labels.length >= 2 && labels.slice(0, -1).every((label) => LABEL.test(label)) && TLD.test(labels[labels.length - 1]);
}

function validateSignup(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) throw new TypeError("body must be an object");
  const errors = [];
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!has("username")) errors.push("username_missing");
  else if (typeof body.username !== "string") errors.push("username_type");
  else if (RESERVED.has(body.username)) errors.push("username_reserved");
  else if (!USERNAME.test(body.username)) errors.push("username_format");

  let email = null;
  if (!has("email")) errors.push("email_missing");
  else if (typeof body.email !== "string") errors.push("email_type");
  else {
    email = body.email.trim().toLowerCase();
    if (!isEmail(email)) errors.push("email_format");
  }

  const password = body.password;
  if (!has("password")) errors.push("password_missing");
  else if (typeof password !== "string") errors.push("password_type");
  else if (password.length < 12 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) errors.push("password_weak");

  if (!has("age")) errors.push("age_missing");
  else if (!Number.isInteger(body.age)) errors.push("age_type");
  else if (body.age < 13 || body.age > 130) errors.push("age_range");

  const optIn = has("marketing_opt_in") ? body.marketing_opt_in : false;
  if (typeof optIn !== "boolean") errors.push("opt_in_type");

  if (errors.length > 0) return { ok: false, errors: errors.sort() };
  return { ok: true, user: { username: body.username, email, age: body.age, marketing_opt_in: optIn } };
}
```

Every field reports one code at most, the email is trimmed and lowercased before it is checked and returned, and the password is left out of the result.
