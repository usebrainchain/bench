def _oracle():
    import random

    rng = random.Random(3350)
    small = ["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "up"]
    others = ["lord", "rings", "tale", "two", "cities", "mice", "men", "war", "peace", "gone", "with", "wind", "x", "is", "it", "into", "upon", "ant", "o", "be", "anD", "tHEE", "ORE"]

    def capital(word):
        lowered = "".join(chr(ord(c) + 32) if "A" <= c <= "Z" else c for c in word)
        first = lowered[0]
        return (chr(ord(first) - 32) if "a" <= first <= "z" else first) + lowered[1:]

    def reference(text):
        words = [word for word in text.split(" ") if word]
        out = []
        for index, word in enumerate(words):
            lowered = "".join(chr(ord(c) + 32) if "A" <= c <= "Z" else c for c in word)
            if lowered in small and 0 < index < len(words) - 1:
                out.append(lowered)
            else:
                out.append(capital(word))
        return " ".join(out)

    def expect(text, want):
        got = title_case(text)
        assert type(got) is str, f"title_case({text!r}) returned {type(got).__name__}, not str"
        assert got == want, f"title_case({text!r}) returned {got!r}, expected {want!r}"

    for text, want in [
        ("the lord of the rings", "The Lord of the Rings"), ("A TALE OF TWO CITIES", "A Tale of Two Cities"),
        ("of mice and men", "Of Mice and Men"), ("something to believe in", "Something to Believe In"),
        ("  war   and peace ", "War and Peace"), ("gone with the wind", "Gone With the Wind"), ("tALE", "Tale"),
        ("the", "The"), ("IN", "In"), ("a", "A"), ("", ""), ("   ", ""), ("what are you up to", "What Are You up To"),
        ("THE END OF THE", "The End of The"), ("an apple a day", "An Apple a Day"), ("x", "X"), ("go On", "Go On"),
        ("for whom the bell tolls", "For Whom the Bell Tolls"), ("one OR two", "One or Two"), ("by and by", "By and By"),
    ]:
        expect(text, want)

    pool = small + [w.upper() for w in small] + ["Of", "tHe", "aN"] + others
    for _ in range(3000):
        words = [rng.choice(pool) for _ in range(rng.randint(0, 8))]
        text = " " * rng.randint(0, 2)
        for word in words:
            text += word + " " * rng.randint(1, 3)
        if rng.random() < 0.5:
            text = text.rstrip(" ")
        expect(text, reference(text))

    for value in [None, 5, b"the title", ["the title"]]:
        try:
            got = title_case(value)
        except TypeError:
            continue
        except Exception as other:
            raise AssertionError(f"title_case({value!r}) raised {type(other).__name__}, expected TypeError")
        raise AssertionError(f"title_case({value!r}) returned {got!r}, expected TypeError")


_oracle()
