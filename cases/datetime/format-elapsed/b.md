Here it is in JavaScript, which keeps it usable in the browser and in Node:

```javascript
function format_elapsed(seconds) {
  if (typeof seconds !== "number" || !Number.isInteger(seconds)) {
    throw new TypeError("seconds must be an integer");
  }
  if (seconds < 0) throw new RangeError("seconds must not be negative");
  const days = Math.floor(seconds / 86400);
  const rest = seconds % 86400;
  const pad = (n) => String(n).padStart(2, "0");
  const clock = `${pad(Math.floor(rest / 3600))}:${pad(Math.floor((rest % 3600) / 60))}:${pad(rest % 60)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}
```

It splits off whole days first, then pads hours, minutes and seconds to two digits each.
