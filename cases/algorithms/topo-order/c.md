```python
def topo_order(nodes, edges):
    waiting_on = {node: set() for node in nodes}
    for before, after in edges:
        waiting_on[after].add(before)

    remaining = set(nodes)
    order = []
    while remaining:
        ready = [node for node in remaining if not waiting_on[node]]
        if not ready:
            raise ValueError(f"cycle among {sorted(remaining)}")
        node = min(ready)
        order.append(node)
        remaining.remove(node)
        for other in remaining:
            waiting_on[other].discard(node)
    return order
```

Each node keeps the set of predecessors it still waits on. Every step places the smallest node with nothing left to wait for. If nodes remain but none is free, they sit on a cycle, so it raises `ValueError`. The sets make repeated edges harmless, and the inputs are only read.
