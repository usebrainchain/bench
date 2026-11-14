{
  const cases = [
    [[255, 16], "FF"],
    [[255n, 16], "FF"],
    [[0, 2], "0"],
    [[35, 36], "Z"],
    [[-255n, 16], "-FF"],
    [[5, 2, 8], "00000101"],
    [[5, 2, 2], "101"],
  ];
  for (const [args, want] of cases) {
    const got = toBase(...args);
    if (got !== want) throw new Error(`toBase(${args.map(String).join(", ")}) returned ${got}, expected ${want}`);
  }
  const throwsA = (Kind, args) => {
    try {
      toBase(...args);
    } catch (error) {
      if (error instanceof Kind) return;
      throw new Error(`toBase(${args.map(String).join(", ")}) threw ${error.name}, expected ${Kind.name}`);
    }
    throw new Error(`toBase(${args.map(String).join(", ")}) did not throw ${Kind.name}`);
  };
  throwsA(RangeError, [1.5, 10]);
  throwsA(RangeError, [10, 37]);
  throwsA(RangeError, [10, 1]);
  throwsA(TypeError, ["10", 10]);
}
