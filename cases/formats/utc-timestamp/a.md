```javascript
const PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(Z|([+-])([01]\d|2[0-3]):([0-5]\d))$/;

function toUtc(text) {
  const match = PATTERN.exec(text);
  if (!match || match[1] === "0000") throw new RangeError(`not a valid date-time: ${text}`);
  const [, year, month, day, hour, minute, second, zone, sign, offsetHour, offsetMinute] = match;
  const date = new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  date.setUTCHours(Number(hour), Number(minute), Number(second), 0);
  if (zone !== "Z") {
    const offset = (Number(offsetHour) * 60 + Number(offsetMinute)) * 60_000;
    date.setTime(date.getTime() + (sign === "+" ? -offset : offset));
  }
  const utcYear = date.getUTCFullYear();
  if (utcYear < 1 || utcYear > 9999) throw new RangeError(`result is outside years 0001 to 9999: ${text}`);
  const two = (n) => String(n).padStart(2, "0");
  return `${String(utcYear).padStart(4, "0")}-${two(date.getUTCMonth() + 1)}-${two(date.getUTCDate())}T${two(date.getUTCHours())}:${two(date.getUTCMinutes())}:${two(date.getUTCSeconds())}Z`;
}
```

The pattern enforces every field's range, so only well-formed input reaches the date arithmetic. `setUTCFullYear` takes the year literally, which avoids the 1900 mapping `Date.UTC` applies to years below 100.
