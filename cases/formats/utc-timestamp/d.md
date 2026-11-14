```javascript
function toUtc(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(text);
  if (!match) throw new RangeError(`not a date-time with an offset: ${text}`);
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const sign = match[7] === "-" ? -1 : 1;
  const offsetHours = match[8] === undefined ? 0 : Number(match[8]);
  const offsetMinutes = match[9] === undefined ? 0 : Number(match[9]);
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59 || offsetHours > 23 || offsetMinutes > 59) {
    throw new RangeError(`field out of range: ${text}`);
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`no such date: ${text}`);
  }
  date.setTime(date.getTime() - sign * (offsetHours * 60 + offsetMinutes) * 60000);
  const utcYear = date.getUTCFullYear();
  if (utcYear < 1 || utcYear > 9999) throw new RangeError(`UTC result is outside years 0001 to 9999: ${text}`);
  const pad = (n, width = 2) => String(n).padStart(width, "0");
  return `${pad(utcYear, 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}Z`;
}
```

The date is built with UTC setters and then read back: if `Date` rolled an impossible day such as February 30 into March, the fields no longer match and the input is refused.
