Write a JavaScript function truncate(text, limit) that shortens text to at most limit characters, cutting only between words and marking the cut with "..." (three ASCII periods).

text is a string of printable ASCII characters (codes 32 to 126) that does not start with a space. Words are separated by one or more spaces. limit is meant to be an integer of at least 4.

- If text.length is at most limit, return text unchanged.
- Otherwise find the largest index i such that text[i] is a space and text.slice(0, i), with its trailing spaces removed, is at most limit - 3 characters long. Return that trimmed prefix followed by "...". The prefix may use all limit - 3 characters: truncate("The quick brown fox", 12) returns "The quick...", which is exactly 12 characters long.
- Spaces inside the kept prefix stay as they are: truncate("one  two  three", 11) returns "one  two...".
- If there is no such index because the first word is too long, return the first limit - 3 characters of text followed by "...": truncate("Supercalifragilistic is long", 10) returns "Superca...".
- Throw a TypeError when text is not a string, and a RangeError when limit is not an integer of at least 4, including non-numbers such as "10".

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
