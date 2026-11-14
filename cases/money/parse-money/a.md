```javascript
function parseMoney(text) {
  if (typeof text !== "string") throw new TypeError("parseMoney: text must be a string");
  const match = text.match(/^(-?)[$€£]?(0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:,[0-9]{3})+)(?:\.([0-9]{2}))?$/);
  if (match === null) throw new SyntaxError(`parseMoney: cannot parse ${JSON.stringify(text)}`);
  const whole = match[2].split(",").join("");
  if (whole.length > 13) throw new SyntaxError(`parseMoney: ${JSON.stringify(text)} has more than 13 digits`);
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(whole) * 100 + Number(match[3] ?? 0));
}
```

One anchored pattern covers the sign, the optional symbol, plain or grouped whole units and the two-digit cents. The sign is applied last as a multiplier, so the digit handling is the same for both signs.
