```javascript
function mergeSorted(lists) {
  const heap = [];
  const before = (x, y) => x.key < y.key || (x.key === y.key && (x.list < y.list || (x.list === y.list && x.index < y.index)));

  const push = (entry) => {
    heap.push(entry);
    for (let i = heap.length - 1; i > 0; ) {
      const parent = (i - 1) >> 1;
      if (!before(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length === 0) return top;
    heap[0] = last;
    for (let i = 0; ; ) {
      let smallest = i;
      for (const child of [2 * i + 1, 2 * i + 2]) {
        if (child < heap.length && before(heap[child], heap[smallest])) smallest = child;
      }
      if (smallest === i) return top;
      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      i = smallest;
    }
  };

  lists.forEach((list, i) => {
    if (list.length > 0) push({ key: list[0].key, list: i, index: 0 });
  });
  const merged = [];
  while (heap.length > 0) {
    const { list, index } = pop();
    merged.push(lists[list][index]);
    if (index + 1 < lists[list].length) push({ key: lists[list][index + 1].key, list, index: index + 1 });
  }
  return merged;
}
```

A k-way merge with a min-heap of list heads. Heap entries order by key, then list index, then position, so ties come out from the earlier list first and in original order within a list. It runs in O(n log k) and only reads the inputs.
