```python
def allocate(amount, ratios):
    if amount < 0 or not ratios or any(r < 0 for r in ratios) or sum(ratios) == 0:
        raise ValueError(f"cannot allocate {amount} by {ratios}")
    total = sum(ratios)
    parts = [amount * r // total for r in ratios]
    leftover = amount - sum(parts)
    i = 0
    while leftover > 0:
        if ratios[i] > 0:
            parts[i] += 1
            leftover -= 1
        i = (i + 1) % len(ratios)
    return parts
```

Each part gets its floored share, then the remaining cents are handed out one at a time, skipping zero-ratio parts so they stay at zero. The total always comes back to `amount`.
