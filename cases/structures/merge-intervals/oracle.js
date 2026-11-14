{
  const show = (value) => JSON.stringify(value);
  // Doubling every endpoint makes touching intervals share a point and leaves a gap between [1, 2] and [3, 4].
  const reference = (intervals) => {
    const covered = new Set();
    for (const [start, end] of intervals) for (let x = 2 * start; x <= 2 * end; x++) covered.add(x);
    const points = [...covered].sort((a, b) => a - b);
    const merged = [];
    for (const x of points) {
      const last = merged[merged.length - 1];
      if (last && x === last[1] + 1) last[1] = x;
      else merged.push([x, x]);
    }
    return merged.map(([a, b]) => [a / 2, b / 2]);
  };
  const check = (input, want) => {
    const before = show(input);
    const pairs = input.slice();
    const got = mergeIntervals(input);
    if (show(input) !== before || input.length !== pairs.length || input.some((pair, i) => pair !== pairs[i])) {
      throw new Error(`mergeIntervals(${before}) modified its input to ${show(input)}`);
    }
    if (!Array.isArray(got) || got === input || show(got) !== show(want)) throw new Error(`mergeIntervals(${before}) returned ${show(got)}, expected ${show(want)}`);
    if (got.some((pair) => !Array.isArray(pair) || input.includes(pair))) throw new Error(`mergeIntervals(${before}) returned an input pair instead of a new one`);
  };

  const fixed = [
    [[], []],
    [[[1, 3], [3, 5]], [[1, 5]]],
    [[[1, 2], [3, 4]], [[1, 2], [3, 4]]],
    [[[5, 6], [1, 3], [2, 4]], [[1, 4], [5, 6]]],
    [[[1, 10], [2, 3]], [[1, 10]]],
    [[[2, 3], [1, 10]], [[1, 10]]],
    [[[3, 4], [1, 10], [2, 2]], [[1, 10]]],
    [[[1, 1], [1, 1]], [[1, 1]]],
    [[[0, 0], [1, 1]], [[0, 0], [1, 1]]],
    [[[-5, -3], [-3, 0]], [[-5, 0]]],
    [[[7, 9]], [[7, 9]]],
    [[[1, 4], [2, 3], [6, 8], [8, 8], [10, 12]], [[1, 4], [6, 8], [10, 12]]],
  ];
  for (const [input, want] of fixed) check(input, want);

  let seed = 7741;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 3000; i++) {
    const input = Array.from({ length: next(9) }, () => {
      const start = next(41) - 20;
      return [start, start + next(8)];
    });
    check(input, reference(input));
  }
}
