Write a Python function duration_ms(text) that converts an ISO 8601 duration limited to days, hours, minutes and seconds into a whole number of milliseconds.

The accepted form is "P", then an optional days part "nD", then optionally "T" followed by one or more of the parts "nH", "nM" and "nS", in that order. Each n is one or more ASCII digits (0 to 9), and leading zeros are allowed. Only the seconds value may have a fraction: a "." followed by one to three ASCII digits, as in "PT1.5S" or "PT0.25S".

- A day is exactly 86,400 seconds. Return an int: "P1D" is 86400000, "PT2H30M" is 9000000, "P1DT1S" is 86401000, "PT1.5S" is 1500, "PT0.001S" is 1 and "PT36H" is 129600000.
- A part whose value is zero still counts as a part: "PT0S" is 0.
- Raise ValueError for every other string, including: "P" or "PT" with no parts; a "T" with nothing after it ("P1DT"); years, months or weeks ("P1Y", "P1M", "P1W"; "PT1M" is one minute, while "P1M" is a month and is refused); a fraction on any part other than seconds ("PT1.5M"); more than three fraction digits ("PT1.2345S"); a comma as the decimal mark ("PT1,5S"); a "." without a digit on both sides ("PT.5S", "PT1.S"); a part that is repeated or out of order ("PT1M1H"); hours, minutes or seconds without the "T" ("P1H"); lowercase letters ("pt1s"); signs; digits outside 0 to 9; and whitespace anywhere.

Deliver the function in one fenced python code block. Use only the Python standard library.
