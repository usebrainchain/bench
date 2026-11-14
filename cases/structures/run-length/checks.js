{
  const show = (value) => JSON.stringify(value);
  const cases = [
    [[], []],
    [["a", "a", "b", "a"], [["a", 2], ["b", 1], ["a", 1]]],
    [[1, 1, 1], [[1, 3]]],
    [[1, 2, 3], [[1, 1], [2, 1], [3, 1]]],
    [[0, -0], [[0, 2]]],
    [[true, true, "true"], [[true, 2], ["true", 1]]],
  ];
  for (const [input, want] of cases) {
    const got = runs(input);
    if (show(got) !== show(want)) throw new Error(`runs(${show(input)}) returned ${show(got)}, expected ${show(want)}`);
  }
}
