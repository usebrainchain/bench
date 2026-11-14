assert edit_distance("ab", "abc") == 1
assert edit_distance("abc", "ab") == 2
assert edit_distance("kitten", "sitting") == 5
assert edit_distance("sitting", "kitten") == 6
assert edit_distance("", "") == 0
assert edit_distance("", "abc") == 3
assert edit_distance("abc", "") == 6
assert edit_distance("flaw", "lawn") == 3
