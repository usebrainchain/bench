Write a Python function lower_bound(items, target) that returns the leftmost index at which target can be inserted into the sorted list items while keeping it sorted.

- items is a list of ints sorted in non-decreasing order. It may be empty and may contain duplicates. target is an int.
- Return the index of the first element that is greater than or equal to target, or len(items) when there is none. The result is an int.
- With duplicates, return the index of the first equal element: lower_bound([1, 2, 2, 2, 3], 2) is 1, and lower_bound([5, 5, 5], 5) is 0.
- lower_bound([1, 3, 5], 4) is 2, lower_bound([1, 3, 5], 0) is 0 and lower_bound([1, 3, 5], 9) is 3.
- An empty list gives 0 for any target: lower_bound([], 7) is 0.
- Do not modify items.

Deliver the function in one fenced python code block. Use only the Python standard library.
