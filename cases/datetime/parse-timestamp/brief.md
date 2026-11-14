Write a JavaScript function parseTimestamp(text) that converts an RFC 3339 timestamp into milliseconds since the Unix epoch, 1970-01-01T00:00:00Z.

The accepted form is exactly YYYY-MM-DDTHH:MM:SS, then optionally a "." and a fraction of 1 to 9 digits, then either "Z" or an offset written "+HH:MM" or "-HH:MM". The "T" and "Z" are uppercase. Every field has exactly the digits shown.

- Year is 0000 to 9999, and years below 100 are those years, never 1900 to 1999: "0050-06-15T00:00:00Z" is -60575040000000.
- Month is 01 to 12, and the day must exist in that month. February has 29 days in leap years by the Gregorian rule (divisible by 4, except century years not divisible by 400), so 2024-02-29 and 2000-02-29 are valid while 2023-02-29 and 1900-02-29 are not.
- Hour is 00 to 23, minute 00 to 59 and second 00 to 59. Offset hours are 00 to 23 and offset minutes 00 to 59.
- The offset is the local time's difference from UTC, so it is subtracted: "2026-11-14T09:30:00+01:00" is 08:30 UTC, 1794645000000.
- Digits of the fraction past the third are dropped, never rounded: "2026-11-14T09:30:00.123456789-05:30" is 15:00:00.123 UTC, 1794668400123.
- "1970-01-01T00:00:00Z" is 0.
- Return the result as an integer number.
- Throw TypeError when text is not a string. Throw RangeError for every string not in the accepted form or with a field out of range, including a lowercase "t" or "z", a space in place of "T", missing seconds, a missing offset, an offset without its colon ("+0100"), an empty fraction ("00.Z") or one of 10 digits, and surrounding whitespace.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
