Write a JavaScript function toBase(n, base, width) that writes the integer n in the given base and returns a string.

- n is either a BigInt of any size or a Number that is a safe integer (Number.isSafeInteger(n) is true). Both give the same digits: toBase(255, 16) and toBase(255n, 16) are both "FF".
- base is a Number, an integer from 2 to 36. Digits above 9 are the uppercase letters A to Z: toBase(35, 36) is "Z".
- Zero is "0", including negative zero as a Number. A negative n starts with "-": toBase(-255n, 16) is "-FF".
- width is optional. When given, it is an integer Number from 0 to 1000, and the digits are padded with leading zeros to at least width digits. The minus sign goes before the zeros and does not count toward width: toBase(5, 2, 8) is "00000101" and toBase(-5n, 2, 8) is "-00000101". Digits are never truncated: toBase(5, 2, 2) is "101".
- Throw TypeError when n is neither a BigInt nor a Number (for example the string "10" or null).
- Throw RangeError when n is a Number that is not a safe integer (such as 1.5, NaN, Infinity or 2 ** 53), when base is not an integer Number from 2 to 36 (such as 1, 37, 2.5 or the string "16"), or when width is given and is not an integer Number from 0 to 1000 (such as -1, 1001, 1.5 or "8").

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
