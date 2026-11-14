Write a JavaScript function parseHexColor(text) that parses a CSS hex colour such as "#ff8800" into an object with the keys r, g, b and a.

- The accepted forms are "#rgb", "#rgba", "#rrggbb" and "#rrggbbaa": a "#" followed by exactly 3, 4, 6 or 8 hex digits. Hex digits are 0 to 9 and a to f in either case, mixed freely, as in "#FfA0c8".
- In the 3 and 4 digit forms each digit stands for itself written twice: "#f80" means "#ff8800" and gives r 255, g 136, b 0.
- r, g and b are integers from 0 to 255.
- a is the alpha byte divided by 255 and rounded to three decimals, computed as Math.round(alpha * 1000 / 255) / 1000. "#ff000080" gives a 0.502, "#0000" gives a 0, and a colour with no alpha digits gives a 1.
- Return a new plain object with exactly the four keys r, g, b and a, all numbers.
- Throw a TypeError when text is not a string. Throw a SyntaxError for every other invalid input: a missing "#" ("ff8800"), any other number of digits ("#ff", "#ff888", "#ff8800f"), any character that is not a hex digit ("#ggg", "#ff 800"), and whitespace before or after the colour (" #fff", "#fff\n").

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
