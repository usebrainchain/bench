{
  const show = (value) => JSON.stringify(value);
  const cases = [
    [[], []],
    [[[1, 3], [3, 5]], [[1, 5]]],
    [[[1, 2], [3, 4]], [[1, 2], [3, 4]]],
    [[[5, 6], [1, 3], [2, 4]], [[1, 4], [5, 6]]],
    [[[1, 10], [2, 3]], [[1, 10]]],
    [[[4, 4]], [[4, 4]]],
  ];
  for (const [input, want] of cases) {
    const got = mergeIntervals(input);
    if (show(got) !== show(want)) throw new Error(`mergeIntervals(${show(input)}) returned ${show(got)}, expected ${show(want)}`);
  }
}
