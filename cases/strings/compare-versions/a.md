```javascript
function compareVersions(a, b) {
  const parse = (version) => {
    const plus = version.indexOf("+");
    const main = plus === -1 ? version : version.slice(0, plus);
    const dash = main.indexOf("-");
    const core = (dash === -1 ? main : main.slice(0, dash)).split(".").map(Number);
    const pre = dash === -1 ? [] : main.slice(dash + 1).split(".");
    return { core, pre };
  };
  const ok = /^[0-9]+$/;
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) {
    if (x.core[i] !== y.core[i]) return x.core[i] < y.core[i] ? -1 : 1;
  }
  if (x.pre.length === 0 || y.pre.length === 0) {
    if (x.pre.length === y.pre.length) return 0;
    return x.pre.length === 0 ? 1 : -1;
  }
  for (let i = 0; i < Math.min(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i];
    const q = y.pre[i];
    if (p === q) continue;
    if (ok.test(p) && ok.test(q)) return Number(p) < Number(q) ? -1 : 1;
    if (ok.test(p)) return -1;
    if (ok.test(q)) return 1;
    return p < q ? -1 : 1;
  }
  return x.pre.length === y.pre.length ? 0 : x.pre.length < y.pre.length ? -1 : 1;
}
```

Test run (node --test):

```
✔ orders major, minor and patch numerically (0.4ms)
✔ puts a pre-release before its release (0.1ms)
✔ compares numeric identifiers as numbers (0.1ms)
✔ 1.0.0-alpha < 1.0.0-alpha.1 (0.1ms)
✔ ignores build metadata (0.1ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```
