Write a Python function parse_duration(text) that converts a duration such as "1h30m" into a whole number of seconds.

A valid duration is one to three parts with no separators. Each part is one or more ASCII digits (0 to 9) followed by a lowercase unit letter: h for hours, m for minutes, s for seconds. Each unit appears at most once, always in the order h, m, s, and any of them may be left out. Leading zeros are allowed, and a part may exceed the next unit up: "90m" is 5400 and "05m" is 300.

- Return the total as an int: "1h30m" is 5400, "45s" is 45, "2h5s" is 7205, "0m" is 0.
- Raise TypeError when text is not a str.
- Raise ValueError for every other string. That includes the empty string, a number with no unit ("10"), a unit with no number ("h"), a repeated unit ("1h1h"), units out of order ("5s3m"), uppercase units ("1H"), signs or decimals ("-1h", "1.5h"), digits outside 0 to 9 (such as "٣m"), and whitespace anywhere, even a single trailing newline ("1h\n").

Deliver the function in one fenced python code block. Use only the Python standard library.
