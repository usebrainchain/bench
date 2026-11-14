```javascript
function vend(prices, events) {
  const accepted = new Set([5, 10, 25, 100]);
  let credit = 0;
  const outputs = [];
  const giveChange = (amount) => {
    const coins = [];
    for (const coin of [25, 10, 5]) {
      while (amount >= coin) {
        coins.push(coin);
        amount -= coin;
      }
    }
    if (coins.length > 0) outputs.push({ type: "return", coins });
  };
  for (const event of events) {
    const [kind, value] = event;
    if (kind === "coin") {
      if (!accepted.has(value) || credit + value > 500) outputs.push({ type: "return", coins: [value] });
      else credit += value;
    } else if (kind === "select") {
      if (!Object.prototype.hasOwnProperty.call(prices, value)) outputs.push({ type: "error", reason: "unknown" });
      else if (credit < prices[value]) outputs.push({ type: "error", reason: "insufficient" });
      else {
        outputs.push({ type: "dispense", product: value });
        giveChange(credit - prices[value]);
        credit = 0;
      }
    } else if (kind === "cancel") {
      giveChange(credit);
      credit = 0;
    }
  }
  return { credit, outputs };
}
```

Change is paid in quarters, dimes and nickels, which keeps the machine from running out of dollar coins, and it still uses the largest coin available first.
