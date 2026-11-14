assert turnstile([]) == ("locked", [])
assert turnstile(["coin", "push"]) == ("locked", ["unlock", "lock"])
assert turnstile(["push"]) == ("locked", ["deny"])
assert turnstile(["coin", "coin"]) == ("unlocked", ["unlock", "refund"])
assert turnstile(["push", "push", "push"]) == ("alarm", ["deny", "deny", "alarm"])
assert turnstile(["push", "push", "push", "coin", "push", "reset", "coin"]) == ("unlocked", ["deny", "deny", "alarm", "refund", "deny", "reset", "unlock"])
try:
    turnstile(["kick"])
except ValueError:
    pass
else:
    raise AssertionError("an unknown event did not raise ValueError")
