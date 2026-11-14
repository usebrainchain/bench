```javascript
function vend(prices, events) {
  const COINS = [100, 25, 10, 5];
  let credit = 0;
  const outputs = [];
  const payOut = (amount) => {
    if (amount <= 0) return;
    const coins = [];
    for (const coin of COINS) for (; amount >= coin; amount -= coin) coins.push(coin);
    outputs.push({ type: "return", coins });
  };
  for (const [type, arg] of events) {
    if (type === "coin") {
      if (COINS.includes(arg)) credit += arg;
      else outputs.push({ type: "return", coins: [arg] });
    } else if (type === "select") {
      if (!Object.prototype.hasOwnProperty.call(prices, arg)) {
        outputs.push({ type: "error", reason: "unknown" });
      } else if (credit < prices[arg]) {
        outputs.push({ type: "error", reason: "insufficient" });
      } else {
        outputs.push({ type: "dispense", product: arg });
        payOut(credit - prices[arg]);
        credit = 0;
      }
    } else {
      payOut(credit);
      credit = 0;
    }
  }
  return { credit, outputs };
}
```

Test run:

```
$ node --test vend.test.mjs
✔ accepts 5, 10, 25 and 100 (0.5ms)
✔ returns any other coin at once (0.1ms)
✔ returns a coin that would take the credit above 500 (0.1ms)
✔ reports unknown and insufficient selections (0.1ms)
✔ pays change largest coin first (0.2ms)
✔ cancel returns the credit (0.1ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```
