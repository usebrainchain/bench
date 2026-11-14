Write a Python function allocate(amount, ratios) that splits an amount of money in cents into parts proportional to integer ratios, using the largest remainder method, so that no cent is lost or invented.

amount is an int of cents, at most 10**15. ratios is a list of ints.

- The exact share of part i is amount * ratios[i] / sum(ratios). Each part first gets its share rounded down to a whole cent.
- The cents left over (amount minus the sum of those rounded-down shares) go one each to the parts with the largest fractional remainders, largest first.
- When parts have equal remainders, the part with the lower index gets its cent first: allocate(100, [1, 1, 1]) is [34, 33, 33] and allocate(2, [1, 1, 1]) is [1, 1, 0].
- Return a new list of ints, one per ratio and in the same order, that always adds up to amount: allocate(100, [1, 2]) is [33, 67] and allocate(5, [1, 0, 4]) is [1, 0, 4]. Do not modify ratios.
- The result must be exact for every amount up to 10**15.
- Raise ValueError when amount is negative, ratios is empty, any ratio is negative, or the ratios add up to zero.

Deliver the function in one fenced python code block. Use only the Python standard library.
