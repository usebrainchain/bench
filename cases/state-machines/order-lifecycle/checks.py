assert apply_events([]) == ("created", [])
assert apply_events(["pay", "ship", "deliver"]) == ("delivered", ["created -> paid", "paid -> shipped", "shipped -> delivered"])
assert apply_events(["cancel"]) == ("cancelled", ["created -> cancelled"])
assert apply_events(["pay", "cancel"]) == ("refunded", ["created -> paid", "paid -> refunded"])
assert apply_events(["ship", "pay"]) == ("paid", ["ignored ship in created", "created -> paid"])
assert apply_events(["pay", "ship", "deliver", "refund"])[0] == "refunded"
try:
    apply_events(["pay", "teleport"])
except ValueError:
    pass
else:
    raise AssertionError("an unknown event did not raise ValueError")
