{
  const same = (a, b) => {
    if (typeof a !== typeof b) return false;
    if (a === null || b === null || typeof a !== "object") return Object.is(a, b);
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a).sort();
    const other = Object.keys(b).sort();
    return keys.length === other.length && keys.every((key, i) => key === other[i] && same(a[key], b[key]));
  };
  const change = (amount) => {
    const coins = [];
    for (const coin of [100, 25, 10, 5]) {
      const count = Math.floor(amount / coin);
      for (let i = 0; i < count; i++) coins.push(coin);
      amount -= count * coin;
    }
    return coins;
  };
  const reference = (prices, events) => {
    let credit = 0;
    const outputs = [];
    for (const event of events) {
      if (event[0] === "coin") {
        const value = event[1];
        if ([5, 10, 25, 100].indexOf(value) !== -1 && credit + value <= 500) credit += value;
        else outputs.push({ type: "return", coins: [value] });
      } else if (event[0] === "select") {
        const code = event[1];
        if (!Object.prototype.hasOwnProperty.call(prices, code)) outputs.push({ type: "error", reason: "unknown" });
        else if (credit < prices[code]) outputs.push({ type: "error", reason: "insufficient" });
        else {
          outputs.push({ type: "dispense", product: code });
          if (credit > prices[code]) outputs.push({ type: "return", coins: change(credit - prices[code]) });
          credit = 0;
        }
      } else {
        if (credit > 0) outputs.push({ type: "return", coins: change(credit) });
        credit = 0;
      }
    }
    return { credit, outputs };
  };
  const run = (prices, events) => {
    const want = reference(prices, events);
    const pricesCopy = JSON.stringify(prices);
    const eventsCopy = JSON.stringify(events);
    const got = vend(prices, events);
    const shown = `vend(${pricesCopy}, ${eventsCopy})`;
    if (JSON.stringify(prices) !== pricesCopy || JSON.stringify(events) !== eventsCopy) throw new Error(`${shown} modified its arguments`);
    if (!same(got, want)) throw new Error(`${shown} returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  };

  const prices = { A1: 75, B2: 120, C3: 5, D4: 500, E5: 335 };
  const fixed = [
    [["coin", 100], ["coin", 3], ["select", "A1"]],
    [["coin", 100], ["coin", 100], ["coin", 100], ["coin", 100], ["coin", 100], ["coin", 100]],
    [["coin", 100], ["coin", 100], ["coin", 100], ["coin", 100], ["coin", 25], ["coin", 25], ["coin", 25], ["coin", 10], ["coin", 10], ["coin", 5], ["cancel"]],
    [["coin", 100], ["coin", 100], ["coin", 100], ["coin", 100], ["coin", 100], ["coin", 5], ["select", "D4"]],
    [["coin", 100], ["coin", 100], ["coin", 100], ["coin", 100], ["coin", 25], ["coin", 25], ["coin", 25], ["coin", 25], ["coin", 25], ["coin", 25], ["coin", 25], ["coin", 25], ["select", "E5"]],
    [["coin", 25], ["coin", 10], ["coin", 5], ["cancel"], ["cancel"]],
    [["coin", 50], ["coin", 1], ["coin", 0], ["coin", -5], ["coin", 2.5], ["coin", 20]],
    [["coin", 100], ["select", "B2"], ["coin", 25], ["select", "B2"]],
    [["coin", 5], ["select", "C3"], ["select", "C3"]],
    [["select", "a1"], ["coin", 100], ["select", "Z9"], ["cancel"]],
  ];
  for (const events of fixed) run(prices, events);

  let seed = 4663;
  const next = (n) => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return (seed >>> 8) % n;
  };
  const coins = [5, 10, 25, 100, 100, 100, 25, 1, 50, 0, -5, 2.5, 20];
  const codes = ["A1", "B2", "C3", "D4", "E5", "Z9", "a1"];
  for (let i = 0; i < 5000; i++) {
    const events = Array.from({ length: next(16) }, () => {
      const roll = next(10);
      if (roll < 6) return ["coin", coins[next(coins.length)]];
      if (roll < 9) return ["select", codes[next(codes.length)]];
      return ["cancel"];
    });
    run(prices, events);
  }
}
