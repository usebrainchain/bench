Write a JavaScript function parseSafeInteger(text) that reads a base-10 integer from a string and returns it as a Number.

- A valid text is an optional sign, "+" or "-", followed by one or more ASCII digits 0 to 9, and nothing else. There is no whitespace anywhere, no decimal point, no exponent, no underscores or other separators and no prefix such as "0x". Leading zeros are allowed and do not change the value: "007" is 7, "+5" is 5, and "-0012" is -12. A string of 400 zeros followed by "1" is 1.
- The value must be a safe integer, from -(2 ** 53 - 1) to 2 ** 53 - 1 inclusive: "9007199254740991" is 9007199254740991, and "9007199254740992" and "-9007199254740992" are out of range.
- A zero result is positive zero: "-0", "+0" and "-000" all return 0, and Object.is(parseSafeInteger("-0"), 0) is true.
- Throw TypeError when text is not a string.
- Throw SyntaxError when text is not of the valid form, for example "", "+", "-", "1.0", "1e3", " 12", "12 ", "1_000", "0x1F", "--1" or "١٢". A text that is not of the valid form throws SyntaxError even when its digits would also be out of range, as in "99999999999999999999x".
- Throw RangeError when text is of the valid form but its value is not a safe integer.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
