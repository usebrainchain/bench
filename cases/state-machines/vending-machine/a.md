```javascript
function vend(prices, events) {
  const ACCEPTED = [5, 10, 25, 100];
  const LIMIT = 500;
  const change = (amount) => {
    const coins = [];
    for (const coin of [100, 25, 10, 5]) {
      while (amount >= coin) {
        coins.push(coin);
        amount -= coin;
      }
    }
    return coins;
  };
  let credit = 0;
  const outputs = [];
  for (const [type, arg] of events) {
    switch (type) {
      case "coin":
        if (ACCEPTED.includes(arg) && credit + arg <= LIMIT) credit += arg;
        else outputs.push({ type: "return", coins: [arg] });
        break;
      case "select":
        if (!Object.prototype.hasOwnProperty.call(prices, arg)) {
          outputs.push({ type: "error", reason: "unknown" });
        } else if (credit < prices[arg]) {
          outputs.push({ type: "error", reason: "insufficient" });
        } else {
          outputs.push({ type: "dispense", product: arg });
          if (credit > prices[arg]) outputs.push({ type: "return", coins: change(credit - prices[arg]) });
          credit = 0;
        }
        break;
      case "cancel":
        if (credit > 0) outputs.push({ type: "return", coins: change(credit) });
        credit = 0;
        break;
    }
  }
  return { credit, outputs };
}
```

A coin outside the four accepted values, or one that would push the credit past 500, goes straight back. Change is greedy from 100 down to 5, which is optimal for these denominations.
