{
  const canon = (value) =>
    Array.isArray(value)
      ? value.map(canon)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canon(value[key])]))
        : value;
  const prices = { A1: 75, B2: 120 };
  const expect = (events, want) => {
    const got = JSON.stringify(canon(vend(prices, events)));
    if (got !== JSON.stringify(canon(want))) throw new Error(`vend(${JSON.stringify(events)}) returned ${got}, expected ${JSON.stringify(want)}`);
  };
  expect([["coin", 25], ["coin", 25], ["coin", 25], ["select", "A1"]], { credit: 0, outputs: [{ type: "dispense", product: "A1" }] });
  expect([["coin", 100], ["coin", 100], ["select", "A1"]], { credit: 0, outputs: [{ type: "dispense", product: "A1" }, { type: "return", coins: [100, 25] }] });
  expect([["coin", 3]], { credit: 0, outputs: [{ type: "return", coins: [3] }] });
  expect([["coin", 25], ["select", "B2"]], { credit: 25, outputs: [{ type: "error", reason: "insufficient" }] });
  expect([["select", "Z9"]], { credit: 0, outputs: [{ type: "error", reason: "unknown" }] });
  expect([["coin", 10], ["coin", 5], ["cancel"]], { credit: 0, outputs: [{ type: "return", coins: [10, 5] }] });
  expect([["cancel"]], { credit: 0, outputs: [] });
}
