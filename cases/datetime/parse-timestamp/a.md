```javascript
const RFC3339 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:(Z)|([+-])(\d{2}):(\d{2}))$/;

function daysFromCivil(year, month, day) {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

function parseTimestamp(text) {
  if (typeof text !== "string") throw new TypeError("timestamp must be a string");
  const match = RFC3339.exec(text);
  if (!match) throw new RangeError(`not an RFC 3339 timestamp: ${text}`);
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLength = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (month < 1 || month > 12 || day < 1 || day > monthLength || hour > 23 || minute > 59 || second > 59) {
    throw new RangeError(`field out of range in ${text}`);
  }
  let offset = 0;
  if (!match[8]) {
    const offsetHours = Number(match[10]);
    const offsetMinutes = Number(match[11]);
    if (offsetHours > 23 || offsetMinutes > 59) throw new RangeError(`offset out of range in ${text}`);
    offset = (match[9] === "-" ? -1 : 1) * (offsetHours * 60 + offsetMinutes);
  }
  const millis = match[7] ? Number(match[7].slice(0, 3).padEnd(3, "0")) : 0;
  const minutes = (daysFromCivil(year, month, day) * 24 + hour) * 60 + minute - offset;
  return minutes * 60000 + second * 1000 + millis;
}
```

The day count comes from a closed-form civil-to-days conversion, so years below 100 and years before 1970 need no special handling. The offset is subtracted to get UTC, and the fraction is cut to three digits without rounding.
