```javascript
const COIN_VALUES = new Set([5, 10, 25, 100]);
const MAX_CREDIT = 500;

function makeChange(amount) {
  return [100, 25, 10, 5].flatMap((coin) => {
    const count = Math.floor(amount / coin);
    amount -= count * coin;
    return Array(count).fill(coin);
  });
}

function vend(prices, events) {
  let credit = 0;
  const outputs = [];
  const payOut = (amount) => {
    if (amount > 0) outputs.push({ type: "return", coins: makeChange(amount) });
  };
  const handlers = {
    coin(value) {
      if (COIN_VALUES.has(value) && credit + value <= MAX_CREDIT) credit += value;
      else outputs.push({ type: "return", coins: [value] });
    },
    select(code) {
      if (!Object.keys(prices).includes(code)) {
        outputs.push({ type: "error", reason: "unknown" });
        return;
      }
      const price = prices[code];
      if (credit < price) {
        outputs.push({ type: "error", reason: "insufficient" });
        return;
      }
      outputs.push({ type: "dispense", product: code });
      payOut(credit - price);
      credit = 0;
    },
    cancel() {
      payOut(credit);
      credit = 0;
    },
  };
  for (const [type, value] of events) handlers[type](value);
  return { credit, outputs };
}
```

Each event type has its own handler; the credit and the output list are shared between them.
