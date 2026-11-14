A pairwise merge, folding each list into the running result:

```javascript
function mergeSorted(lists) {
  const mergeTwo = (left, right) => {
    const out = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (right[j].key < left[i].key) out.push(right[j++]);
      else out.push(left[i++]);
    }
    return out.concat(right.slice(j));
  };
  return lists.reduce((merged, list) => mergeTwo(merged, list), []);
}
```

The running result always holds the earlier lists, and on equal keys it wins because the test is a strict `<`, so ties keep list order.
