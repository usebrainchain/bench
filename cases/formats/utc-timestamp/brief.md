Write a JavaScript function toUtc(text) that converts an ISO 8601 date-time with an explicit UTC offset into the same instant written in UTC.

The input has exactly the form YYYY-MM-DDTHH:MM:SS followed by a zone, with nothing before or after it:
- YYYY is a four-digit year from 0001 to 9999, MM is a month from 01 to 12, and DD is a day that exists in that month of that year in the proleptic Gregorian calendar. Leap years are the years divisible by 4, except century years not divisible by 400: "2024-02-29" exists, while "2026-02-29", "1900-02-29" and "2026-04-31" do not.
- The separator is an uppercase "T". The hour is 00 to 23, the minute 00 to 59 and the second 00 to 59. There are no leap seconds and no fractional seconds.
- The zone is an uppercase "Z" or an offset "+HH:MM" or "-HH:MM", with offset hours 00 to 23 and offset minutes 00 to 59. An offset is local time minus UTC, so "+02:00" means UTC is two hours earlier. "-00:00" means the same as "Z".

Return the instant as "YYYY-MM-DDTHH:MM:SSZ" in UTC, always with a four-digit year and a trailing "Z": toUtc("2026-03-01T01:30:00+02:00") is "2026-02-28T23:30:00Z", toUtc("2024-12-31T23:00:00-01:30") is "2025-01-01T00:30:00Z", and toUtc("0099-06-01T12:00:00Z") is "0099-06-01T12:00:00Z".

Throw RangeError for any input that does not have this exact form, for a date or time that does not exist, and when the UTC result falls outside the years 0001 to 9999, as with "0001-01-01T00:30:00+01:00" or "9999-12-31T23:59:59-00:01".

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins. If you use Date, use only its UTC methods.
