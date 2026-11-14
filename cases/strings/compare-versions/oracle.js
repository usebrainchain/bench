{
  const parse = (version) => {
    const main = version.split("+")[0];
    const dash = main.indexOf("-");
    return {
      core: (dash === -1 ? main : main.slice(0, dash)).split(".").map(BigInt),
      pre: dash === -1 ? [] : main.slice(dash + 1).split("."),
    };
  };
  const numeric = (id) => /^[0-9]+$/.test(id);
  const order = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
  const reference = (a, b) => {
    const x = parse(a);
    const y = parse(b);
    for (let i = 0; i < 3; i++) if (x.core[i] !== y.core[i]) return order(x.core[i], y.core[i]);
    if (x.pre.length === 0 || y.pre.length === 0) return order(y.pre.length, x.pre.length);
    for (let i = 0; i < Math.min(x.pre.length, y.pre.length); i++) {
      const p = x.pre[i];
      const q = y.pre[i];
      if (p === q) continue;
      if (numeric(p) && numeric(q)) return order(BigInt(p), BigInt(q));
      if (numeric(p) !== numeric(q)) return numeric(p) ? -1 : 1;
      return order(p, q);
    }
    return order(x.pre.length, y.pre.length);
  };
  const expect = (a, b, want) => {
    const got = compareVersions(a, b);
    if (got !== want) throw new Error(`compareVersions(${JSON.stringify(a)}, ${JSON.stringify(b)}) returned ${String(got)}, expected ${want}`);
  };

  const chain = ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta", "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0", "1.0.1", "1.1.0", "1.9.0", "1.10.0", "2.0.0-0", "2.0.0-1", "2.0.0-10", "2.0.0-a", "2.0.0", "10.0.0"];
  for (let i = 0; i < chain.length; i++) for (let j = 0; j < chain.length; j++) expect(chain[i], chain[j], order(i, j));

  const fixed = [
    ["1.0.0-alpha.10", "1.0.0-alpha.9", 1], ["1.0.0-1", "1.0.0-alpha", -1], ["1.0.0-x-y", "1.0.0-x", 1],
    ["1.0.0-x-y", "1.0.0-x-z", -1], ["1.0.0+exp.sha-5114f85", "1.0.0", 0], ["1.0.0-rc.1+build-7", "1.0.0-rc.1", 0],
    ["1.0.0-A", "1.0.0-a", -1], ["1.0.0-Z", "1.0.0-a", -1], ["1.0.0--", "1.0.0-0", 1], ["1.0.0-0a", "1.0.0-1", 1],
    ["999999999999999.0.0", "999999999999998.9.9", 1], ["0.0.999999999999999", "0.0.999999999999998", 1],
    ["1.0.0-999999999999999", "1.0.0-999999999999998", 1], ["1.2.3-beta.2+x", "1.2.3-beta.2+y-z", 0],
  ];
  for (const [a, b, want] of fixed) {
    expect(a, b, want);
    expect(b, a, -want || 0);
  }

  let seed = 20261114;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const numbers = ["0", "1", "2", "9", "10", "11", "99", "100", "123456789012345"];
  const identifiers = ["alpha", "beta", "rc", "a", "A", "Z", "zz", "x-y", "-", "a1", "1a", "0a", "0", "1", "2", "9", "10", "11", "100"];
  const builds = ["", "+build.1", "+exp.sha-5114f85", "+001", "+a-b-c"];
  const version = () => {
    const core = [0, 1, 2].map(() => numbers[next(numbers.length)]).join(".");
    const length = next(4);
    const pre = length === 0 ? "" : "-" + Array.from({ length }, () => identifiers[next(identifiers.length)]).join(".");
    return core + pre + builds[next(builds.length)];
  };
  const pool = Array.from({ length: 400 }, version);
  for (let i = 0; i < 20000; i++) {
    const a = pool[next(pool.length)];
    const b = next(5) === 0 ? a.split("+")[0] + builds[next(builds.length)] : pool[next(pool.length)];
    expect(a, b, reference(a, b));
  }
}
