```python
def allocate(amount, ratios):
    if amount < 0:
        raise ValueError("amount must not be negative")
    if not ratios or any(ratio < 0 for ratio in ratios):
        raise ValueError("ratios must be a non-empty list of non-negative ints")
    total = sum(ratios)
    if total == 0:
        raise ValueError("ratios must not all be zero")

    parts = []
    remainders = []
    for ratio in ratios:
        share, remainder = divmod(amount * ratio, total)
        parts.append(share)
        remainders.append(remainder)

    leftover = amount - sum(parts)
    by_remainder = sorted(range(len(ratios)), key=lambda i: (-remainders[i], i))
    for i in by_remainder[:leftover]:
        parts[i] += 1
    return parts
```

Every share is an integer quotient and remainder over the same denominator, so the remainders compare exactly and nothing goes through floats. Sorting by descending remainder and then by index hands out the leftover cents, with ties going to the lower index.
