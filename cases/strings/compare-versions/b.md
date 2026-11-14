```javascript
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

function compareIdentifiers(left, right) {
  const leftNumeric = /^\d+$/.test(left);
  const rightNumeric = /^\d+$/.test(right);
  if (leftNumeric && rightNumeric) return Math.sign(Number(left) - Number(right));
  if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareVersions(a, b) {
  const [, ...left] = SEMVER.exec(a);
  const [, ...right] = SEMVER.exec(b);
  for (let i = 0; i < 3; i++) {
    const difference = Number(left[i]) - Number(right[i]);
    if (difference !== 0) return Math.sign(difference);
  }
  const leftPre = left[3] === undefined ? null : left[3].split(".");
  const rightPre = right[3] === undefined ? null : right[3].split(".");
  if (leftPre === null || rightPre === null) {
    if (leftPre === rightPre) return 0;
    return leftPre === null ? 1 : -1;
  }
  for (let i = 0; i < Math.min(leftPre.length, rightPre.length); i++) {
    const order = compareIdentifiers(leftPre[i], rightPre[i]);
    if (order !== 0) return order;
  }
  return Math.sign(leftPre.length - rightPre.length);
}
```

The pattern captures the three core numbers and the pre-release, and leaves build metadata out of every comparison. Numbers stay below 2^53 at 15 digits, so plain `Number` arithmetic is exact.
