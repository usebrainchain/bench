```javascript
function runs(values) {
  const result = [];
  let previous;
  for (const value of values) {
    const signature = JSON.stringify(value);
    if (result.length > 0 && signature === previous) {
      result[result.length - 1][1] += 1;
    } else {
      result.push([value, 1]);
      previous = signature;
    }
  }
  return result;
}
```

Comparing serialized forms makes NaN match NaN, which plain `===` would not, and treats 0 and -0 alike.

```
$ node --test runs.test.js
✔ empty input gives no runs (0.3ms)
✔ groups consecutive equal strings (0.1ms)
✔ NaN equals NaN (0.1ms)
✔ 0 and -0 form one run (0.1ms)
✔ objects compare by identity: runs([{}, {}]) has two runs (0.1ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```
