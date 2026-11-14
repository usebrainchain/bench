Write a JavaScript function parseMoney(text) that reads an amount of money written for people, such as "$1,234.56" or "-€0.50", and returns it as an integer number of cents.

The format, in this order, with nothing before, between or after its parts:
- An optional minus sign "-".
- An optional currency symbol: "$", "€" or "£". The symbol never changes the value.
- The whole units, written either as plain digits with no commas ("1234") or with a comma before every group of three digits counted from the right ("1,234,567": the first group has one to three digits and every later group exactly three). The whole units are "0" or start with a digit from 1 to 9, so "01" and "0,123" are invalid. They have at most 13 digits, not counting commas.
- Optionally a "." followed by exactly two digits ("0.50", "12.07").

Only the ASCII digits 0 to 9 count as digits. Whitespace, a plus sign, a symbol before the minus sign ("$-5"), a second symbol and any other character make the text invalid.

Return the amount in cents as a number: "$1,234.56" is 123456, "-€0.50" is -50, "1234" is 123400, "£0" is 0. A zero amount is always 0, never -0, so "-0.00" and "-$0" return 0.

Throw TypeError when text is not a primitive string. Throw SyntaxError for every string that does not follow the format, including "", "1.5", "1.", ".50", "1,23", "12,34.00" and "1 234".

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
