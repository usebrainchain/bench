Write a Python function slugify(text, max_length) that turns a title into a URL slug of at most max_length characters.

text is a str of ASCII characters. max_length is an int.

- A word is a maximal run of ASCII letters and digits. Uppercase letters become lowercase; letters and digits are otherwise kept as they are.
- Every other character (spaces, punctuation, underscores, hyphens and the rest) only separates words. The slug is the words joined by single hyphens, with no hyphen at the start or end: "Hello, World!" gives "hello-world", "  Many   spaces  " gives "many-spaces", "a--b__c" gives "a-b-c" and "Don't Stop" gives "don-t-stop".
- When the full slug is longer than max_length, keep as many whole words from the start as fit within max_length, joined by single hyphens. Never cut a word and never end with a hyphen: "The quick brown fox" with max_length 15 gives "the-quick-brown", and with max_length 12 gives "the-quick".
- When the first word alone is longer than max_length, return the first max_length characters of that word: "Supercalifragilistic" with max_length 5 gives "super".
- Text with no letters or digits gives "".
- Raise TypeError when text is not a str, and ValueError when max_length is less than 1.

Deliver the function in one fenced python code block. Use only the Python standard library.
