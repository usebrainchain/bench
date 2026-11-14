```python
from collections import deque


def topo_order(nodes, edges):
    indegree = {node: 0 for node in nodes}
    successors = {node: [] for node in nodes}
    for before, after in edges:
        successors[before].append(after)
        indegree[after] += 1

    queue = deque(sorted(node for node in nodes if indegree[node] == 0))
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for after in sorted(successors[node]):
            indegree[after] -= 1
            if indegree[after] == 0:
                queue.append(after)

    if len(order) != len(nodes):
        raise ValueError("cycle detected")
    return order
```

Kahn's algorithm. The starting nodes are sorted and each node's successors are released in sorted order, so the queue always hands out the smallest name first and the order is the lexicographically smallest one. Nodes left over after the queue drains are on a cycle.
