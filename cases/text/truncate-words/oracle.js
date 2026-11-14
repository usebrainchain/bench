{
  const reference = (text, limit) => {
    if (text.length <= limit) return text;
    let best = null;
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== " ") continue;
      let end = i;
      while (end > 0 && text[end - 1] === " ") end--;
      if (end > 0 && end <= limit - 3) best = text.slice(0, end);
    }
    return (best ?? text.slice(0, limit - 3)) + "...";
  };
  const show = (value) => (typeof value === "string" ? JSON.stringify(value) : String(value));
  const expect = (text, limit, want) => {
    const got = truncate(text, limit);
    if (got !== want) throw new Error(`truncate(${show(text)}, ${limit}) returned ${show(got)}, expected ${show(want)}`);
  };
  const expectError = (text, limit, type) => {
    let got;
    try {
      got = truncate(text, limit);
    } catch (error) {
      if (error instanceof type) return;
      throw new Error(`truncate(${show(text)}, ${show(limit)}) threw ${error?.name}, expected ${type.name}`);
    }
    throw new Error(`truncate(${show(text)}, ${show(limit)}) returned ${show(got)}, expected ${type.name}`);
  };

  const fixed = [
    ["The quick brown fox", 12, "The quick..."],
    ["one  two  three", 11, "one  two..."],
    ["Supercalifragilistic is long", 10, "Superca..."],
    ["Hello world", 11, "Hello world"],
    ["Hello world", 10, "Hello..."],
    ["Hello world", 8, "Hello..."],
    ["Hello world", 7, "Hell..."],
    ["Hello world", 4, "H..."],
    ["The quick brown fox jumps", 16, "The quick..."],
    ["The quick brown fox jumps", 18, "The quick brown..."],
    ["alpha beta gamma delta", 15, "alpha beta..."],
    ["a b c d e f", 6, "a b..."],
    ["a b c d e f", 7, "a b..."],
    ["a b c d e f", 8, "a b c..."],
    ["ab   cd", 6, "ab..."],
    ["trailing spaces   ", 17, "trailing..."],
    ["x y", 4, "x y"],
    ["x yzw", 4, "x..."],
    ["one, two; three!", 12, "one, two;..."],
  ];
  for (const [text, limit, want] of fixed) expect(text, limit, want);

  let seed = 1187;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const printable = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).join("");
  for (let i = 0; i < 4000; i++) {
    let text = "";
    const count = 1 + next(8);
    for (let w = 0; w < count; w++) {
      if (w > 0) text += " ".repeat(1 + next(3));
      const length = 1 + next(10);
      for (let c = 0; c < length; c++) text += printable[next(printable.length)];
    }
    if (next(4) === 0) text += " ".repeat(1 + next(3));
    const limit = 4 + next(30);
    expect(text, limit, reference(text, limit));
  }

  for (const value of [null, undefined, 5, ["Hello world"], {}]) expectError(value, 10, TypeError);
  for (const limit of [3, 0, -1, 4.5, NaN, Infinity, "10", null, undefined, [10]]) expectError("Hello world", limit, RangeError);
}
