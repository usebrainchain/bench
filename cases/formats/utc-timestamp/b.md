```javascript
function toUtc(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-]\d{2}:\d{2})$/.exec(text);
  if (!match) throw new RangeError(`unsupported date-time: ${text}`);
  let [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const zone = match[7];
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysIn = (y, m) => (m === 2 ? (isLeap(y) ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysIn(year, month) || hour > 23 || minute > 59 || second > 59) {
    throw new RangeError(`no such date-time: ${text}`);
  }
  let offset = 0;
  if (zone !== "Z") {
    const offsetHours = Number(zone.slice(1, 3));
    const offsetMinutes = Number(zone.slice(4, 6));
    if (offsetHours > 23 || offsetMinutes > 59) throw new RangeError(`bad offset: ${text}`);
    offset = (zone[0] === "+" ? 1 : -1) * (offsetHours * 60 + offsetMinutes);
  }
  let minutes = hour * 60 + minute - offset;
  if (minutes < 0) {
    minutes += 1440;
    day -= 1;
    if (day === 0) {
      month -= 1;
      if (month === 0) {
        month = 12;
        year -= 1;
      }
      day = daysIn(year, month);
    }
  } else if (minutes >= 1440) {
    minutes -= 1440;
    day += 1;
    if (day > daysIn(year, month)) {
      day = 1;
      month += 1;
      if (month === 13) {
        month = 1;
        year += 1;
      }
    }
  }
  if (year < 1 || year > 9999) throw new RangeError(`result outside years 0001 to 9999: ${text}`);
  const pad = (value, width = 2) => String(value).padStart(width, "0");
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:${pad(second)}Z`;
}
```

No `Date` at all: an offset is under 24 hours, so applying it moves the date by at most one day, and that single step is rolled over by hand through month and year ends.
