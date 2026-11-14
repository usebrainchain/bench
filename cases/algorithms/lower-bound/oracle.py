def _oracle():
    import random

    rng = random.Random(7741)

    def expect(items, target, want):
        before = list(items)
        got = lower_bound(items, target)
        assert items == before, f"lower_bound({before!r}, {target!r}) modified items to {items!r}"
        assert type(got) is int, f"lower_bound({before!r}, {target!r}) returned {type(got).__name__}, not int"
        assert got == want, f"lower_bound({before!r}, {target!r}) returned {got}, expected {want}"

    for items, target, want in [
        ([], 7, 0), ([], -7, 0), ([], 0, 0),
        ([1], 0, 0), ([1], 1, 0), ([1], 2, 1),
        ([1, 2, 2, 2, 3], 2, 1), ([5, 5, 5], 5, 0), ([5, 5, 5], 6, 3), ([5, 5, 5], 4, 0),
        ([1, 3, 5], 4, 2), ([1, 3, 5], 0, 0), ([1, 3, 5], 9, 3), ([1, 3, 5], 5, 2), ([1, 3, 5], 1, 0),
        ([-10, -3, -3, 0, 0, 0, 7], 0, 3), ([-10, -3, -3, 0, 0, 0, 7], -3, 1), ([-10, -3, -3, 0, 0, 0, 7], 8, 7),
        ([10 ** 30, 10 ** 30 + 1], 10 ** 30 + 1, 1),
    ]:
        expect(items, target, want)

    for _ in range(4000):
        size = rng.randint(0, 40)
        spread = rng.choice([2, 5, 50, 10 ** 6])
        items = sorted(rng.randint(-spread, spread) for _ in range(size))
        if items and rng.random() < 0.5:
            target = rng.choice(items) + rng.choice([-1, 0, 0, 1])
        else:
            target = rng.randint(-spread - 2, spread + 2)
        expect(items, target, sum(1 for value in items if value < target))

    big = list(range(0, 200000, 2))
    for target in [-1, 0, 1, 2, 99999, 100000, 199998, 199999, 200000, 10 ** 9]:
        expect(big, target, sum(1 for value in big if value < target))


_oracle()
