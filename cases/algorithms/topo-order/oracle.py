def _oracle():
    import random

    rng = random.Random(5309)

    def reference(nodes, edges):
        placed, order = set(), []
        while len(order) < len(nodes):
            ready = [node for node in nodes if node not in placed and all(before in placed for before, after in edges if after == node)]
            if not ready:
                return None
            node = min(ready)
            placed.add(node)
            order.append(node)
        return order

    def expect(nodes, edges, want):
        nodes_before, edges_before = list(nodes), list(edges)
        if want is None:
            try:
                got = topo_order(nodes, edges)
            except ValueError:
                got = ValueError
            except Exception as other:
                raise AssertionError(f"topo_order({nodes_before!r}, {edges_before!r}) raised {type(other).__name__}, expected ValueError")
            assert got is ValueError, f"topo_order({nodes_before!r}, {edges_before!r}) returned {got!r}, expected ValueError"
        else:
            got = topo_order(nodes, edges)
            assert type(got) is list, f"topo_order({nodes_before!r}, {edges_before!r}) returned {type(got).__name__}, not list"
            assert got == want, f"topo_order({nodes_before!r}, {edges_before!r}) returned {got!r}, expected {want!r}"
        assert nodes == nodes_before and edges == edges_before, f"topo_order({nodes_before!r}, {edges_before!r}) modified its arguments"

    for nodes, edges, want in [
        (["b", "a", "c"], [("c", "a"), ("b", "a")], ["b", "c", "a"]),
        (["a", "b", "c", "d"], [("d", "a"), ("c", "b")], ["c", "b", "d", "a"]),
        (["z", "a"], [], ["a", "z"]),
        (["q"], [], ["q"]),
        (["b", "a", "c"], [("c", "a")], ["b", "c", "a"]),
        (["m", "k", "a"], [("m", "k")], ["a", "m", "k"]),
        (["10", "9", "B", "a"], [], ["10", "9", "B", "a"]),
        (["a", "b"], [("a", "b"), ("a", "b"), ("a", "b")], ["a", "b"]),
        (["a"], [("a", "a")], None),
        (["a", "b", "c"], [("a", "b"), ("b", "c"), ("c", "a")], None),
        (["a", "b", "z"], [("a", "b"), ("b", "b")], None),
        (["a", "b", "z"], [("a", "b"), ("b", "a")], None),
    ]:
        expect(nodes, edges, want)

    names = ["a", "b", "c", "d", "e", "f", "g", "h", "aa", "ab", "B", "Z", "10", "9", "node", "n"]
    for _ in range(1500):
        nodes = rng.sample(names, rng.randint(1, len(names)))
        rank = list(nodes)
        rng.shuffle(rank)
        edges = []
        for _ in range(rng.randint(0, 2 * len(nodes))):
            i, j = sorted(rng.sample(range(len(rank)), 2)) if len(rank) > 1 else (0, 0)
            if i != j:
                edges.append((rank[i], rank[j]))
        if edges and rng.random() < 0.3:
            edges.append(rng.choice(edges))
        if rng.random() < 0.25:
            if len(rank) > 1 and rng.random() < 0.7:
                i, j = sorted(rng.sample(range(len(rank)), 2))
                edges += [(rank[i], rank[j]), (rank[j], rank[i])]
            else:
                node = rng.choice(rank)
                edges.append((node, node))
            rng.shuffle(edges)
        expect(nodes, edges, reference(nodes, edges))


_oracle()
