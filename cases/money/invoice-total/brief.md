Write a JavaScript function invoiceTotal(lines, taxBps) that totals an invoice whose tax is rounded line by line.

- lines is an array of at most 100 line objects. Each has an integer quantity from 1 to 1000 and an integer unitCents, the unit price in cents before tax, from 0 to 100000000. taxBps is the tax rate in basis points, an integer from 0 to 10000 (2000 is 20%).
- A line's amount is quantity * unitCents.
- A line's tax is its amount * taxBps / 10000, rounded to the nearest cent with exact halves rounded up.
- The invoice's tax is the sum of the rounded line taxes, never the tax on the subtotal rounded once. Two lines of 5 cents at 1000 basis points each have a tax of 0.5, rounded to 1, so that invoice's tax is 2, even though 10% of its 10 cent subtotal is 1.
- Return a new object with exactly the keys subtotal, tax and total: subtotal is the sum of the line amounts, tax the sum of the line taxes, and total is subtotal plus tax, all as integer numbers of cents. An empty invoice returns { subtotal: 0, tax: 0, total: 0 }.
- Throw RangeError when taxBps, or any line's quantity or unitCents, is not an integer in its range, including values that are not numbers. Do not modify lines or the line objects.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
