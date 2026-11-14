def _oracle():
    import random

    rng = random.Random(5150)

    def reference(items, key):
        keys = [key(item) for item in items]
        return [item for i, item in enumerate(items) if keys[i] not in keys[i + 1:]]

    def check(items, key, want, label):
        before = list(items)
        got = dedupe_last(items, key)
        assert items == before, f"dedupe_last({label}) modified its input to {items!r}"
        assert type(got) is list, f"dedupe_last({label}) returned {type(got).__name__}, expected list"
        assert got is not items, f"dedupe_last({label}) returned the input list itself"
        assert got == want, f"dedupe_last({label}) returned {got!r}, expected {want!r}"

    first = lambda s: s[0]
    by_id = lambda r: r["id"]
    for items, key, want in [
        ([], len, []),
        (["a1", "b1", "a2"], first, ["b1", "a2"]),
        (["aa", "b", "cc"], len, ["b", "cc"]),
        ([1, 2, 3], lambda n: n, [1, 2, 3]),
        (["x"], len, ["x"]),
        (["a1", "a2", "a3"], first, ["a3"]),
        (["a1", "b1", "c1", "b2", "a2"], first, ["c1", "b2", "a2"]),
        ([(1, "a"), (2, "b"), (1, "c"), (3, "d"), (2, "e")], first, [(1, "c"), (3, "d"), (2, "e")]),
        ([{"id": 1, "v": 0}, {"id": 2, "v": 1}, {"id": 1, "v": 2}], by_id, [{"id": 2, "v": 1}, {"id": 1, "v": 2}]),
    ]:
        check(items, key, want, f"{items!r}, ...")

    for trial in range(2000):
        size = rng.randint(0, 12)
        if trial % 2:
            items = [(rng.choice([0, 1, 2, 3, "k", (4, 5)]), n) for n in range(size)]
            key = first
        else:
            items = [{"id": rng.randint(0, 4), "n": n} for n in range(size)]
            key = by_id
        check(items, key, reference(items, key), repr(items))


_oracle()
