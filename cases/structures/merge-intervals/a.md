```javascript
function mergeIntervals(intervals) {
  const sorted = intervals.map(([start, end]) => [start, end]).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}
```

The pairs are copied before sorting, so the input is never touched. `start <= last[1]` merges touching intervals as well as overlapping ones, and `Math.max` keeps the outer end when one interval sits inside another.
