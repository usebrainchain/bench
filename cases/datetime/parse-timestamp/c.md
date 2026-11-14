```javascript
function parseTimestamp(text) {
  if (typeof text !== "string") {
    throw new TypeError(`parseTimestamp expects a string, got ${typeof text}`);
  }
  const match = text.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.(\d{1,9}))?(Z|([+-])(\d\d):(\d\d))$/);
  if (!match) throw new RangeError(`invalid timestamp: ${JSON.stringify(text)}`);
  const [, year, month, day, hour, minute, second, fraction, zone, sign, offsetHour, offsetMinute] = match;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const daysInMonth = mo === 2 ? (y % 400 === 0 || (y % 4 === 0 && y % 100 !== 0) ? 29 : 28) : [4, 6, 9, 11].includes(mo) ? 30 : 31;
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth) throw new RangeError(`invalid date in ${text}`);
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) throw new RangeError(`invalid time in ${text}`);
  let offset = 0;
  if (zone !== "Z") {
    if (Number(offsetHour) > 23 || Number(offsetMinute) > 59) throw new RangeError(`invalid offset in ${text}`);
    offset = (sign === "+" ? 1 : -1) * (Number(offsetHour) * 60 + Number(offsetMinute));
  }
  const instant = new Date(0);
  instant.setUTCFullYear(y, mo - 1, d);
  instant.setUTCHours(Number(hour), Number(minute) - offset, Number(second), fraction ? Number(fraction.slice(0, 3).padEnd(3, "0")) : 0);
  return instant.getTime();
}
```

`setUTCFullYear` takes the year literally, unlike `Date.UTC`, which would turn years 0 to 99 into 1900 to 1999. Passing `minute - offset` to `setUTCHours` lets the Date normalise the offset across hour and day boundaries.
