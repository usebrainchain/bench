```python
import heapq


def topo_order(nodes, edges):
    indegree = {node: 0 for node in nodes}
    successors = {node: [] for node in nodes}
    for before, after in edges:
        successors[before].append(after)
        indegree[after] += 1

    ready = [node for node in nodes if indegree[node] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        node = heapq.heappop(ready)
        order.append(node)
        for after in successors[node]:
            indegree[after] -= 1
            if indegree[after] == 0:
                heapq.heappush(ready, after)

    if len(order) != len(nodes):
        raise ValueError("the edges contain a cycle")
    return order
```

Kahn's algorithm with a min-heap of the nodes whose predecessors are all placed, so each step takes the smallest candidate. Duplicate edges add to the in-degree and are removed the same number of times, and any node left on a cycle (a self-loop included) never reaches in-degree zero, which raises `ValueError`.
