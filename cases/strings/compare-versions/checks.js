{
  const cases = [
    ["1.0.0", "2.0.0", -1],
    ["2.1.0", "2.0.9", 1],
    ["1.0.0", "1.0.0", 0],
    ["1.10.0", "1.9.0", 1],
    ["1.0.0-alpha", "1.0.0", -1],
    ["1.0.0-alpha", "1.0.0-beta", -1],
    ["1.0.0+build.1", "1.0.0+build.2", 0],
  ];
  for (const [a, b, want] of cases) {
    const got = compareVersions(a, b);
    if (got !== want) throw new Error(`compareVersions(${a}, ${b}) returned ${got}, expected ${want}`);
  }
}
