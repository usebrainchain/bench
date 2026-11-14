Write a JavaScript function parseQuery(query) that parses a URL query string into an array of [name, value] pairs, in the order they appear. query is always a string.

- A single leading "?" is removed first: "?a=1" and "a=1" give the same result, while "??a=1" has the name "?a".
- The rest is split on "&", and empty segments are skipped: "a=1&&b=2&" gives [["a", "1"], ["b", "2"]], and both "" and "?" give [].
- Each segment is split at its first "=": "a=b=c" gives ["a", "b=c"]. A segment with no "=" has the value "": "flag" gives ["flag", ""]. "=1" gives ["", "1"].
- In names and values, every "+" stands for a space. After that, each percent escape "%XY" (two hex digits, in either case) stands for one byte, and the bytes are decoded as UTF-8. So "a+b%20c" is "a b c", "%2B" is a literal "+", and "S%C3%A3o" is "São". Every other character is kept as it is.
- Repeated names stay as separate pairs, in order.
- Throw URIError for a "%" that is not followed by two hex digits ("%", "%4", "%zz") and for escapes whose bytes are not valid UTF-8, such as "%FF", the incomplete "%E2%82" or the overlong "%C0%AF".

Return a new array of two-element arrays of strings.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
