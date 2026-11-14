Write a Python function parse_ini(text) that parses a small INI document into a dict that maps each section name to a dict of that section's keys and values. Every name, key and value is a str.

text is a str whose only whitespace characters are spaces, tabs and "\n". Lines are separated by "\n", and each line is read after removing its leading and trailing spaces and tabs:
- An empty line is ignored. A line whose first character is ";" or "#" is a comment and is ignored. A ";" or "#" anywhere later in a line is ordinary text: "path = a;b # c" sets path to "a;b # c".
- A line whose first character is "[" is a section header. It must end with "]", and the section name is the text between the first "[" and the final "]" with surrounding spaces and tabs removed: "[ server ]" starts the section "server". An empty name ("[]" or "[  ]") is an error, and so is a line such as "[a] x" that does not end with "]".
- Any other line must contain "=". The key is the text before the first "=" and the value is the text after it, each with surrounding spaces and tabs removed: "url = http://h.test/?a=b" sets url to "http://h.test/?a=b". The key must not be empty; the value may be empty.
- Keys that appear before the first header belong to the section "" (the empty string).
- Section names and keys are case-sensitive. When a key repeats within a section, the later value replaces the earlier one. When a header repeats, its keys go into the same section.

The result has one entry for every section that has a header, even one with no keys, plus the entry "" only when at least one key appears before the first header: parse_ini("[a]\n") is {"a": {}} and parse_ini("") is {}.

Raise ValueError for a malformed header, for a key line whose key is empty (" = 1"), and for any line that is none of the above (such as "just text").

Deliver the function in one fenced python code block. Use only the Python standard library.
