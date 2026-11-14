```javascript
function mergeSorted(lists) {
  const positions = lists.map(() => 0);
  const merged = [];
  for (;;) {
    let best = -1;
    for (let i = 0; i < lists.length; i++) {
      if (positions[i] >= lists[i].length) continue;
      if (best === -1 || lists[i][positions[i]].key <= lists[best][positions[best]].key) best = i;
    }
    if (best === -1) return merged;
    merged.push(lists[best][positions[best]++]);
  }
}
```

Each step scans the head of every list, takes the smallest key and advances that list's cursor. The input arrays are only read, and the result is a new array of the same objects.
