```javascript
function runs(values) {
  const same = (x, y) => x === y || (x !== x && y !== y);
  const result = [];
  for (const value of values) {
    const last = result[result.length - 1];
    if (last !== undefined && same(last[0], value)) last[1] += 1;
    else result.push([value, 1]);
  }
  return result;
}
```

`x !== x` is true only for NaN, so `same` is `===` with NaN made equal to itself. Each run keeps the element that started it.
