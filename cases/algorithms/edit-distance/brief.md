Write a Python function edit_distance(source, target) that returns the lowest total cost of turning the string source into the string target, using these operations and costs:

- insert one character: cost 1
- delete one character: cost 2
- replace one character with a different character: cost 2

The costs are not symmetric, so the direction matters: edit_distance("ab", "abc") is 1 (one insertion) but edit_distance("abc", "ab") is 2 (one deletion). edit_distance("kitten", "sitting") is 5 (two replacements and one insertion), while edit_distance("sitting", "kitten") is 6.

- Characters are compared exactly, one Python str character at a time, and case matters: "A" and "a" are different characters, so edit_distance("Apple", "apple") is 2.
- Both arguments are str of at most 500 characters, and either may be empty: edit_distance("", "") is 0, edit_distance("", "abc") is 3 and edit_distance("abc", "") is 6.
- Return the cost as an int.

Deliver the function in one fenced python code block. Use only the Python standard library.
