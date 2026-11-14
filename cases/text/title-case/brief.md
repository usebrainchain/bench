Write a Python function title_case(text) that converts a title to title case.

text is a str made only of ASCII letters and spaces. A word is a maximal run of letters.

- Each word is written with its first letter uppercase and every other letter lowercase: "tALE" becomes "Tale".
- These small words are written entirely in lowercase, whatever their case in the input: a, an, and, as, at, but, by, for, in, nor, of, on, or, the, to, up.
- The first word and the last word always get a capital first letter, even when they are small words: "of mice and men" becomes "Of Mice and Men", and "something to believe in" becomes "Something to Believe In". A title of one word is both first and last, so "the" becomes "The".
- Words in the result are separated by exactly one space, with no leading or trailing spaces: "  war   and peace " becomes "War and Peace".
- Text with no letters, such as "" or "   ", returns "".
- Raise TypeError when text is not a str.

Deliver the function in one fenced python code block. Use only the Python standard library.
