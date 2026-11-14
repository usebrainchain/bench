Here is `runs`. It scans once and extends the current run while the next element equals the run's first element:

```javascript
function runs(values) {
  const pairs = [];
  let i = 0;
  while (i < values.length) {
    const first = values[i];
    let j = i + 1;
    while (j < values.length && values[j] === first) j++;
    pairs.push([first, j - i]);
    i = j;
  }
  return pairs;
}
```

The input is only read, and each pair's value is the element that started the run.
