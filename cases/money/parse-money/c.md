Here is `parseMoney`. It checks each part of the text in order instead of using one large regular expression:

```javascript
function parseMoney(text) {
  if (typeof text !== "string") throw new TypeError(`parseMoney expects a string, got ${typeof text}`);
  const fail = () => {
    throw new SyntaxError(`invalid money amount: ${JSON.stringify(text)}`);
  };
  const allDigits = (s) => s.length > 0 && [...s].every((c) => c >= "0" && c <= "9");

  let rest = text;
  const negative = rest.startsWith("-");
  if (negative) rest = rest.slice(1);
  if (rest.startsWith("$") || rest.startsWith("€") || rest.startsWith("£")) rest = rest.slice(1);

  const [whole, fraction, extra] = rest.split(".");
  if (extra !== undefined) fail();
  if (fraction !== undefined && (fraction.length !== 2 || !allDigits(fraction))) fail();

  const groups = whole.split(",");
  if (!groups.every(allDigits)) fail();
  if (groups.length > 1 && (groups[0].length > 3 || groups.slice(1).some((g) => g.length !== 3))) fail();

  const digits = groups.join("");
  if ((digits.length > 1 && digits[0] === "0") || digits.length > 13) fail();

  const cents = Number(digits) * 100 + Number(fraction ?? "0");
  if (cents === 0) return 0;
  return negative ? -cents : cents;
}
```
