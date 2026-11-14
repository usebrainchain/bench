Write a Python function topo_order(nodes, edges) that returns the lexicographically smallest topological order of a directed graph.

- nodes is a list of distinct strings naming every node of the graph. A node may have no edges at all.
- edges is a list of (before, after) tuples of node names, meaning before must come earlier than after. Every name in edges is in nodes. The same tuple may appear more than once.
- Return a list holding every node of nodes exactly once, in which before comes earlier than after for every edge.
- Build the list one node at a time. At each step, the candidates are the nodes not yet placed whose predecessors are all placed; always take the smallest candidate by ordinary Python string comparison (the < operator on str). That makes the answer unique: topo_order(["b", "a", "c"], [("c", "a"), ("b", "a")]) is ["b", "c", "a"], and topo_order(["a", "b", "c", "d"], [("d", "a"), ("c", "b")]) is ["c", "b", "d", "a"].
- A node with no edges is placed by the same rule: topo_order(["z", "a"], []) is ["a", "z"].
- If the edges contain a cycle, including a self-loop such as ("a", "a"), raise ValueError.
- Do not modify nodes or edges.

Deliver the function in one fenced python code block. Use only the Python standard library.
