Here is `allocate`, using exact fractions for the shares:

```python
import math
from fractions import Fraction


def allocate(amount, ratios):
    total = sum(ratios)
    if amount < 0 or not ratios or min(ratios) < 0 or total == 0:
        raise ValueError(f"cannot allocate {amount} by {ratios}")
    shares = [Fraction(amount * ratio, total) for ratio in ratios]
    parts = [math.floor(share) for share in shares]
    leftover = amount - sum(parts)
    ranked = sorted(range(len(ratios)), key=lambda i: shares[i] - parts[i], reverse=True)
    for i in ranked[:leftover]:
        parts[i] += 1
    return parts
```

`sorted` with `reverse=True` keeps equal keys in their original order, so parts with equal remainders get their cent in index order.
