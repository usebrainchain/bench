def _oracle():
    import random

    rng = random.Random(7193)

    def reference(amount, ratios):
        total = sum(ratios)
        parts = [amount * ratio // total for ratio in ratios]
        left = amount - sum(parts)
        taken = set()
        while left > 0:
            best = None
            for index, ratio in enumerate(ratios):
                if index in taken:
                    continue
                remainder = amount * ratio % total
                if best is None or remainder > best[0]:
                    best = (remainder, index)
            taken.add(best[1])
            parts[best[1]] += 1
            left -= 1
        return parts

    def expect(amount, ratios, want):
        given = list(ratios)
        got = allocate(amount, given)
        assert given == ratios, f"allocate({amount}, {ratios}) modified ratios to {given}"
        assert type(got) is list and all(type(part) is int for part in got), f"allocate({amount}, {ratios}) returned {got!r}, not a list of ints"
        assert got == want, f"allocate({amount}, {ratios}) returned {got}, expected {want}"

    for amount, ratios, want in [
        (100, [1, 1, 1], [34, 33, 33]), (2, [1, 1, 1], [1, 1, 0]), (1, [1, 1], [1, 0]),
        (10, [1, 1, 1, 1], [3, 3, 2, 2]), (3, [1, 1, 1, 1, 1], [1, 1, 1, 0, 0]),
        (100, [1, 2], [33, 67]), (5, [1, 0, 4], [1, 0, 4]), (0, [3, 4], [0, 0]),
        (1, [0, 0, 1], [0, 0, 1]), (7, [5], [7]), (1000, [50, 30, 20], [500, 300, 200]),
        (10 ** 15, [1, 2], [333333333333333, 666666666666667]),
        (10 ** 15, [1, 1, 1], [333333333333334, 333333333333333, 333333333333333]),
        (10 ** 15 - 1, [1, 1, 1, 1, 1, 1, 1], [142857142857143, 142857142857143, 142857142857143, 142857142857143, 142857142857143, 142857142857142, 142857142857142]),
    ]:
        assert reference(amount, ratios) == want, f"oracle reference disagrees on {amount}, {ratios}"
        expect(amount, ratios, want)

    for _ in range(3000):
        size = rng.randint(1, 8)
        top = rng.choice([1, 3, 20, 1000])
        ratios = [rng.randint(0, top) for _ in range(size)]
        if sum(ratios) == 0:
            ratios[rng.randrange(size)] = 1
        amount = rng.randrange(0, 10 ** rng.randint(1, 15) + 1)
        expect(amount, ratios, reference(amount, ratios))

    for amount, ratios in [(-1, [1]), (-100, [1, 2]), (10, []), (10, [1, -1]), (10, [-1, -2]), (10, [0, 0]), (0, [0])]:
        try:
            got = allocate(amount, list(ratios))
        except ValueError:
            continue
        except Exception as other:
            raise AssertionError(f"allocate({amount}, {ratios}) raised {type(other).__name__}, expected ValueError")
        raise AssertionError(f"allocate({amount}, {ratios}) returned {got!r}, expected ValueError")


_oracle()
