Write a Python function round_half_even(text, places) that rounds a decimal number given as a string to a number of decimal places, sending exact halves to the even digit, and returns the result as a string.

- text is an optional minus sign, then one or more ASCII digits, then optionally a point followed by one or more ASCII digits, and nothing else. Leading zeros are allowed. It has at most 40 digits in total. Examples: "2.675", "-0.125", "007", "1234.5".
- places is an int from 0 to 20. You may assume it is valid.
- Round to places digits after the point. When the discarded digits are exactly half a unit of the last kept place, round to the neighbour whose last digit is even; otherwise round to the nearer neighbour. "2.675" at 2 places is "2.68", "2.665" is "2.66", "2.6651" is "2.67", "0.125" is "0.12", "2.5" at 0 places is "2", "3.5" is "4", "-2.5" is "-2".
- The arithmetic must be exact decimal arithmetic: "123456789012345678901234567.5" at 0 places is "123456789012345678901234568", and "0.30000000000000004441" at 20 places is "0.30000000000000004441".
- The result has exactly places digits after the point, and no point when places is 0: "1" at 2 places is "1.00". It has no leading zeros beyond a single 0 before the point: "007.5" at 0 places is "8".
- A result that rounds to zero never carries a minus sign: "-0.004" at 2 places is "0.00", and "-0.5" at 0 places is "0".
- Raise ValueError when text does not have the form above, for example "", "-", "+1", ".5", "5.", "1e3", " 1", "1\n", "1,5", "--1" or "١".

Deliver the function in one fenced python code block. Use only the Python standard library.
