```javascript
const MONEY = /^(-)?[$€£]?(0|[1-9]\d{0,2}(?:,\d{3})+|[1-9]\d*)(?:\.(\d{2}))?$/;

function parseMoney(text) {
  if (typeof text !== "string") throw new TypeError("parseMoney expects a string");
  const match = MONEY.exec(text);
  if (!match) throw new SyntaxError(`Not a money amount: ${JSON.stringify(text)}`);
  const [, minus, units, cents = "00"] = match;
  const digits = units.replace(/,/g, "");
  if (digits.length > 13) throw new SyntaxError(`Too many digits: ${JSON.stringify(text)}`);
  const value = Number(digits) * 100 + Number(cents);
  return minus && value !== 0 ? -value : value;
}
```

The whole units match "0", a correctly grouped number or a plain number with no leading zero. Thirteen digits plus cents stay below 2^53, so `Number` is exact, and a zero amount never picks up the minus sign.
