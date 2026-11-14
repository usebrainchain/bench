assert dedupe_last([], len) == []
assert dedupe_last(["a1", "b1", "a2"], lambda s: s[0]) == ["b1", "a2"]
assert dedupe_last([1, 2, 3], lambda n: n) == [1, 2, 3]
assert dedupe_last(["aa", "b", "cc"], len) == ["b", "cc"]
records = [{"id": 1, "v": "old"}, {"id": 2, "v": "x"}, {"id": 1, "v": "new"}]
assert dedupe_last(records, lambda r: r["id"]) == [{"id": 2, "v": "x"}, {"id": 1, "v": "new"}]
original = ["a1", "b1", "a2"]
dedupe_last(original, lambda s: s[0])
assert original == ["a1", "b1", "a2"]
