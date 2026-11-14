`compareVersions` splits off build metadata, compares the core numerically and then walks the pre-release identifiers:

```javascript
function compareVersions(a, b) {
  const cut = (version) => {
    const main = version.split("+")[0];
    const i = main.indexOf("-");
    return i === -1 ? [main, null] : [main.slice(0, i), main.slice(i + 1)];
  };
  const [coreA, preA] = cut(a);
  const [coreB, preB] = cut(b);
  const numsA = coreA.split(".").map(Number);
  const numsB = coreB.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (numsA[i] > numsB[i]) return 1;
    if (numsA[i] < numsB[i]) return -1;
  }
  if (preA === preB) return 0;
  if (preA === null) return 1;
  if (preB === null) return -1;
  const idsA = preA.split(".");
  const idsB = preB.split(".");
  for (let i = 0; i < Math.max(idsA.length, idsB.length); i++) {
    if (idsA[i] === undefined) return -1;
    if (idsB[i] === undefined) return 1;
    if (idsA[i] < idsB[i]) return -1;
    if (idsA[i] > idsB[i]) return 1;
  }
  return 0;
}
```

A release sorts after its pre-releases, and a shorter pre-release list sorts first when it is a prefix of the longer one.
