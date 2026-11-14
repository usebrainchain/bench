Write a Python function parse_size(text) that converts a human-readable size such as "1.5 KiB" or "20 MB" into a whole number of bytes.

A valid size is a number, then at most one ASCII space, then a unit, with nothing before or after.

- The number is one or more ASCII digits (0 to 9), optionally followed by a dot and one or more digits, with at most 30 digits in total. "20", "0.25" and "007" are valid; ".5", "5.", "1e3", "-1", "+1", "1,5" and "٣" are not.
- The unit is exactly one of B (1 byte), kB (1000), MB (1000^2), GB (1000^3), TB (1000^4), KiB (1024), MiB (1024^2), GiB (1024^3) and TiB (1024^4). Units are case-sensitive, so "KB", "kb", "kib", "mb" and "b" are invalid. The unit is required: "512" is invalid.
- "1.5 KiB" and "1.5KiB" are both valid. Two spaces, a tab, or any whitespace before or after the size (including a trailing newline) make it invalid.

Return an int: the number times the unit, computed exactly with no floating-point error, then rounded to the nearest whole byte with exact halves rounded up. "1.5 KiB" is 1536, "20 MB" is 20000000, "2.5 B" is 3, "0.4 B" is 0, "1.0005 kB" is 1001 and "1.1 KiB" is 1126.

Raise TypeError when text is not a str, and ValueError for every invalid string.

Deliver the function in one fenced python code block. Use only the Python standard library.
