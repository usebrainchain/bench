```javascript
function mergeIntervals(intervals) {
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [start, end] of sorted) {
    const prev = out[out.length - 1];
    if (prev !== undefined && start <= prev[1]) prev[1] = end;
    else out.push([start, end]);
  }
  return out;
}
```

Sorting a copy by start means each interval can only merge into the last one emitted. Overlapping and touching intervals extend it; anything after a gap starts a new pair.
