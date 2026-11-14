def _oracle():
    import random
    import sys
    from functools import lru_cache

    rng = random.Random(6007)

    def reference(source, target):
        @lru_cache(maxsize=None)
        def cost(i, j):
            if i == len(source):
                return len(target) - j
            if j == len(target):
                return 2 * (len(source) - i)
            keep_or_replace = cost(i + 1, j + 1) + (0 if source[i] == target[j] else 2)
            return min(cost(i + 1, j) + 2, cost(i, j + 1) + 1, keep_or_replace)

        return cost(0, 0)

    def expect(source, target, want):
        got = edit_distance(source, target)
        label = f"edit_distance({source!r}, {target!r})" if len(source) + len(target) < 80 else f"edit_distance(<{len(source)} chars>, <{len(target)} chars>)"
        assert type(got) is int, f"{label} returned {type(got).__name__}, not int"
        assert got == want, f"{label} returned {got}, expected {want}"

    for source, target, want in [
        ("ab", "abc", 1), ("abc", "ab", 2), ("kitten", "sitting", 5), ("sitting", "kitten", 6),
        ("Apple", "apple", 2), ("apple", "APPLE", 10), ("", "", 0), ("", "abc", 3), ("abc", "", 6),
        ("flaw", "lawn", 3), ("abc", "abd", 2), ("a", "a", 0), ("A", "a", 2), ("abc", "cba", 4),
        ("é", "é", 3), ("same text", "same text", 0), ("aaaa", "aa", 4), ("aa", "aaaa", 2),
    ]:
        expect(source, target, want)

    alphabet = "abABé "
    for _ in range(2500):
        source = "".join(rng.choice(alphabet) for _ in range(rng.randint(0, 8)))
        target = "".join(rng.choice(alphabet) for _ in range(rng.randint(0, 8)))
        expect(source, target, reference(source, target))

    limit = sys.getrecursionlimit()
    sys.setrecursionlimit(10000)
    try:
        for _ in range(2):
            source = "".join(rng.choice("abcAB") for _ in range(500))
            target = "".join(rng.choice("abcAB") for _ in range(rng.randint(450, 500)))
            want = reference(source, target)
            expect(source, target, want)
    finally:
        sys.setrecursionlimit(limit)


_oracle()
