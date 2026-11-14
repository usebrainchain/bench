assert slugify("Hello, World!", 50) == "hello-world"
assert slugify("  Many   spaces  ", 50) == "many-spaces"
assert slugify("a--b__c", 50) == "a-b-c"
assert slugify("The quick brown fox", 15) == "the-quick-brown"
assert slugify("The quick brown fox", 12) == "the-quick"
assert slugify("!!!", 10) == ""
try:
    slugify("title", 0)
except ValueError:
    pass
else:
    raise AssertionError("slugify('title', 0) did not raise ValueError")
