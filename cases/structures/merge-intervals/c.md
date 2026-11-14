Sort a shallow copy by start, then sweep once and fold every interval that starts at or before the current end into it:

```javascript
function mergeIntervals(intervals) {
  const order = [...intervals].sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const result = [];
  let i = 0;
  while (i < order.length) {
    const start = order[i][0];
    let end = order[i][1];
    i++;
    while (i < order.length && order[i][0] <= end) {
      end = Math.max(end, order[i][1]);
      i++;
    }
    result.push([start, end]);
  }
  return result;
}
```

Each returned pair is built fresh, and the input array and its pairs are only read.
