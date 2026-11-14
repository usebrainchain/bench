{
  const cases = [
    ["Hello world", 11, "Hello world"],
    ["Hello world", 20, "Hello world"],
    ["The quick brown fox jumps", 16, "The quick..."],
    ["alpha beta gamma delta", 15, "alpha beta..."],
    ["Supercalifragilistic is long", 10, "Superca..."],
  ];
  for (const [text, limit, want] of cases) {
    const got = truncate(text, limit);
    if (got !== want) throw new Error(`truncate(${JSON.stringify(text)}, ${limit}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  }
  let threw = false;
  try {
    truncate("Hello world", 3);
  } catch (error) {
    threw = error instanceof RangeError;
  }
  if (!threw) throw new Error("truncate with limit 3 must throw RangeError");
}
