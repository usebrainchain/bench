```python
def allocate(amount, ratios):
    if amount < 0:
        raise ValueError("amount must be non-negative")
    if not ratios or any(r < 0 for r in ratios) or sum(ratios) == 0:
        raise ValueError("ratios must be non-negative and add up to more than zero")
    total = sum(ratios)
    parts = [amount * r // total for r in ratios]
    remainders = [amount * r % total for r in ratios]
    leftover = amount - sum(parts)
    ranked = sorted(range(len(ratios)), key=lambda i: (remainders[i], i), reverse=True)
    for i in ranked[:leftover]:
        parts[i] += 1
    return parts
```

Shares are floored with integer division, then the leftover cents go to the parts with the largest remainders. Including the index in the sort key keeps the order deterministic when remainders are equal.
