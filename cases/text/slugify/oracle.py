def _oracle():
    import random

    rng = random.Random(9021)
    kept = "abcdefghijklmnopqrstuvwxyz0123456789"

    def reference(text, max_length):
        words, word = [], ""
        for char in text:
            folded = chr(ord(char) + 32) if "A" <= char <= "Z" else char
            if folded in kept:
                word += folded
            elif word:
                words.append(word)
                word = ""
        if word:
            words.append(word)
        if not words:
            return ""
        if len(words[0]) > max_length:
            return words[0][:max_length]
        slug = words[0]
        for word in words[1:]:
            if len(slug) + 1 + len(word) > max_length:
                break
            slug += "-" + word
        return slug

    def expect(text, max_length, want):
        got = slugify(text, max_length)
        assert type(got) is str, f"slugify({text!r}, {max_length}) returned {type(got).__name__}, not str"
        assert got == want, f"slugify({text!r}, {max_length}) returned {got!r}, expected {want!r}"

    def expect_error(text, max_length, error):
        try:
            got = slugify(text, max_length)
        except error:
            return
        except Exception as other:
            raise AssertionError(f"slugify({text!r}, {max_length!r}) raised {type(other).__name__}, expected {error.__name__}")
        raise AssertionError(f"slugify({text!r}, {max_length!r}) returned {got!r}, expected {error.__name__}")

    for text, max_length, want in [
        ("Hello, World!", 50, "hello-world"), ("  Many   spaces  ", 50, "many-spaces"), ("a--b__c", 50, "a-b-c"),
        ("Don't Stop", 50, "don-t-stop"), ("The quick brown fox", 15, "the-quick-brown"), ("The quick brown fox", 14, "the-quick"),
        ("The quick brown fox", 12, "the-quick"), ("The quick brown fox", 9, "the-quick"), ("The quick brown fox", 8, "the"),
        ("The quick brown fox", 3, "the"), ("The quick brown fox", 2, "th"), ("Supercalifragilistic", 5, "super"),
        ("Supercalifragilistic word", 20, "supercalifragilistic"), ("Supercalifragilistic word", 19, "supercalifragilisti"),
        ("!!!", 10, ""), ("", 3, ""), ("Version 2.0 Release", 50, "version-2-0-release"), ("ABC123def", 50, "abc123def"),
        ("-leading and trailing-", 50, "leading-and-trailing"), ("one two", 7, "one-two"), ("one two", 6, "one"), ("x", 1, "x"),
        ("\tTabs\nand\rbreaks ", 50, "tabs-and-breaks"),
    ]:
        expect(text, max_length, want)

    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" + " -_.,!?'/()\t"
    for _ in range(3000):
        text = "".join(rng.choice(alphabet) for _ in range(rng.randint(0, 40)))
        max_length = rng.randint(1, 25)
        expect(text, max_length, reference(text, max_length))

    for value in [None, 5, b"title", ["title"]]:
        expect_error(value, 10, TypeError)
    for max_length in [0, -1, -50]:
        expect_error("title", max_length, ValueError)


_oracle()
