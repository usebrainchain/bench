```javascript
function runs(values) {
  const pairs = [];
  for (const value of values) {
    const last = pairs[pairs.length - 1];
    // includes compares with SameValueZero: === except that NaN equals NaN.
    if (last && [last[0]].includes(value)) last[1]++;
    else pairs.push([value, 1]);
  }
  return pairs;
}
```

`Array.prototype.includes` uses SameValueZero, which is exactly the equality the brief asks for, so NaN joins a run of NaN and 0 joins a run of -0.
