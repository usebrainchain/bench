{
  const expect = (lists, label) => {
    const tagged = [];
    lists.forEach((list, listIndex) => list.forEach((element, position) => tagged.push({ element, listIndex, position })));
    for (let i = 1; i < tagged.length; i++) {
      const current = tagged[i];
      let j = i - 1;
      while (j >= 0 && tagged[j].element.key > current.element.key) {
        tagged[j + 1] = tagged[j];
        j--;
      }
      tagged[j + 1] = current;
    }
    const want = tagged.map((entry) => entry.element);
    const shape = lists.map((list) => list.slice());
    const keys = lists.map((list) => list.map((element) => `${element.key}:${element.value}`).join("|"));
    const got = mergeSorted(lists);
    const describe = (list) => JSON.stringify(list.map((element) => [element.key, element.value]));
    if (!Array.isArray(got)) throw new Error(`${label}: mergeSorted returned ${String(got)}, not an array`);
    if (lists.some((list) => list === got) || got === lists) throw new Error(`${label}: mergeSorted returned one of its inputs instead of a new array`);
    if (lists.length !== shape.length || lists.some((list, i) => list.length !== shape[i].length || list.some((element, j) => element !== shape[i][j]))) throw new Error(`${label}: mergeSorted modified its input arrays`);
    if (lists.some((list, i) => list.map((element) => `${element.key}:${element.value}`).join("|") !== keys[i])) throw new Error(`${label}: mergeSorted modified an element`);
    if (got.length !== want.length || got.some((element, i) => element !== want[i])) throw new Error(`${label}: mergeSorted(${JSON.stringify(lists.map((list) => list.map((element) => [element.key, element.value])))}) returned ${describe(got)}, expected ${describe(want)}`);
  };

  const a1 = { key: 1, value: "a" };
  const b1 = { key: 1, value: "b" };
  const c2 = { key: 2, value: "c" };
  const d1 = { key: 1, value: "d" };
  expect([[a1], [b1, c2], [d1]], "brief example");
  expect([], "no lists");
  expect([[], []], "empty lists");
  expect([[{ key: 5, value: "p" }, { key: 5, value: "q" }], [{ key: 5, value: "r" }]], "equal keys");
  expect([[{ key: -1.5, value: "m" }], [{ key: -1.5, value: "n" }, { key: 1e300, value: "o" }], [{ key: -1e300, value: "l" }]], "extreme keys");

  let seed = 31337;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const pool = [-7, -2.5, 0, 1, 1, 2, 3, 3, 3, 4.25, 10, 100];
  for (let trial = 0; trial < 3000; trial++) {
    let counter = 0;
    const lists = Array.from({ length: next(7) }, () =>
      Array.from({ length: next(9) }, () => pool[next(pool.length)])
        .sort((x, y) => x - y)
        .map((key) => ({ key, value: `v${counter++}` })),
    );
    expect(lists, `random trial ${trial}`);
  }
}
