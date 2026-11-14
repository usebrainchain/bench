```javascript
function lowerBound(items, target) {
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (items[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
```

A standard half-open binary search: it returns the first index whose element is at least `target`, `items.length` when there is none, and 0 for an empty array.
