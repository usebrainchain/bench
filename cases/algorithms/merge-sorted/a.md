```javascript
function mergeSorted(lists) {
  return lists.flat().sort((x, y) => x.key - y.key);
}
```

`flat()` builds a new array in list order and, within each list, in original order. `Array.prototype.sort` is stable, so elements with equal keys stay in exactly that order: earlier lists first, then original position.
