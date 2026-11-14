assert topo_order(["b", "a", "c"], [("c", "a"), ("b", "a")]) == ["b", "c", "a"]
assert topo_order(["a", "b", "c", "d"], [("d", "a"), ("c", "b")]) == ["c", "b", "d", "a"]
assert topo_order(["a", "b", "c", "d"], [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")]) == ["a", "b", "c", "d"]
assert topo_order(["x", "y", "z"], [("z", "x"), ("z", "y")]) == ["z", "x", "y"]
assert topo_order(["a", "b"], [("a", "b"), ("a", "b")]) == ["a", "b"]
try:
    topo_order(["a", "b"], [("a", "b"), ("b", "a")])
except ValueError:
    pass
else:
    raise AssertionError("a two-node cycle did not raise ValueError")
