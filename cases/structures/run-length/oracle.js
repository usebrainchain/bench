{
  const label = (value) => {
    if (typeof value === "number") return Object.is(value, -0) ? "-0" : String(value);
    if (typeof value === "string") return JSON.stringify(value);
    if (value !== null && typeof value === "object") return Array.isArray(value) ? "[array]" : "{object}";
    return String(value);
  };
  const show = (items) => `[${items.map((item) => (Array.isArray(item) && item.length === 2 && typeof item[1] === "number" ? `[${label(item[0])}, ${item[1]}]` : label(item))).join(", ")}]`;
  const equal = (x, y) => x === y || (Number.isNaN(x) && Number.isNaN(y));
  const reference = (values) => {
    const out = [];
    let i = 0;
    while (i < values.length) {
      let j = i;
      while (j < values.length && equal(values[j], values[i])) j++;
      out.push([values[i], j - i]);
      i = j;
    }
    return out;
  };
  const check = (values) => {
    const before = values.slice();
    const want = reference(before);
    const got = runs(values);
    if (values.length !== before.length || values.some((value, i) => !Object.is(value, before[i]))) {
      throw new Error(`runs(${show(before)}) modified its input to ${show(values)}`);
    }
    const ok =
      Array.isArray(got) &&
      got !== values &&
      got.length === want.length &&
      got.every((pair, k) => Array.isArray(pair) && pair.length === 2 && Object.is(pair[0], want[k][0]) && pair[1] === want[k][1]);
    if (!ok) throw new Error(`runs(${show(before)}) returned ${Array.isArray(got) ? show(got) : String(got)}, expected ${show(want)}`);
  };

  const shared = {};
  const list = [1];
  for (const values of [
    [],
    ["a", "a", "b", "a"],
    [NaN, NaN, 1],
    [NaN, NaN, NaN],
    [1, NaN, NaN, 1],
    [0, -0],
    [-0, 0, 0],
    [{}, {}],
    [shared, shared, {}],
    [list, list, [1]],
    [null, null, undefined, undefined],
    [NaN, null],
    [null, NaN],
    [1, "1", 1],
    [true, 1],
  ]) check(values);

  let seed = 424242;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const pool = [0, -0, 1, "1", "a", "", NaN, null, undefined, true, false, shared, list, () => ({}), () => []];
  for (let i = 0; i < 4000; i++) {
    const values = [];
    for (let length = next(12); values.length < length; ) {
      const pick = pool[next(pool.length)];
      const value = typeof pick === "function" ? pick() : pick;
      for (let repeat = 1 + next(3); repeat > 0 && values.length < length; repeat--) values.push(value);
    }
    check(values);
  }
}
