```javascript
function parseTimestamp(text) {
  if (typeof text !== "string") throw new TypeError("timestamp must be a string");
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/.exec(text);
  if (!parts) throw new RangeError(`bad timestamp: ${text}`);
  const [year, month, day, hour, minute, second] = parts.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const last = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (!last || day < 1 || day > last || hour > 23 || minute > 59 || second > 59) throw new RangeError(`out of range: ${text}`);
  let offset = 0;
  if (parts[8] !== "Z") {
    const hours = Number(parts[8].slice(1, 3));
    const minutes = Number(parts[8].slice(4, 6));
    if (hours > 23 || minutes > 59) throw new RangeError(`bad offset: ${text}`);
    offset = (parts[8][0] === "-" ? -1 : 1) * (hours * 60 + minutes) * 60000;
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, parts[7] ? Number(parts[7].slice(0, 3).padEnd(3, "0")) : 0);
  return date.getTime() + offset;
}
```

The fields are range-checked, the calendar date is set with `setUTCFullYear` so early years stay literal, and the offset is applied to the result in milliseconds.
