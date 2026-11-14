def _oracle():
    import random

    rng = random.Random(6604)
    upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    lower = "abcdefghijklmnopqrstuvwxyz"
    digits = "0123456789"

    def reference(name):
        out = []
        for i, char in enumerate(name):
            if i > 0 and char in upper:
                before = name[i - 1]
                after = name[i + 1] if i + 1 < len(name) else ""
                if before in lower or before in digits or (before in upper and after != "" and after in lower):
                    out.append("_")
            out.append(lower[upper.index(char)] if char in upper else char)
        return "".join(out)

    def expect(name, want):
        got = to_snake(name)
        assert type(got) is str, f"to_snake({name!r}) returned {type(got).__name__}, not str"
        assert got == want, f"to_snake({name!r}) returned {got!r}, expected {want!r}"

    def expect_error(value, error):
        try:
            got = to_snake(value)
        except error:
            return
        except Exception as other:
            raise AssertionError(f"to_snake({value!r}) raised {type(other).__name__}, expected {error.__name__}")
        raise AssertionError(f"to_snake({value!r}) returned {got!r}, expected {error.__name__}")

    for name, want in [
        ("parseJson", "parse_json"), ("ParseJson", "parse_json"), ("utf8Decode", "utf8_decode"),
        ("parseHTTPResponse", "parse_http_response"), ("HTMLParser", "html_parser"), ("userID", "user_id"),
        ("HTTP2Server", "http2_server"), ("base64Encode", "base64_encode"), ("version2", "version2"),
        ("userIDs", "user_i_ds"), ("lowercase", "lowercase"), ("x", "x"), ("X", "x"), ("ABC", "abc"),
        ("aB", "a_b"), ("ABc", "a_bc"), ("aBCd", "a_b_cd"), ("A1B", "a1_b"), ("getURL", "get_url"),
        ("XMLHttpRequest", "xml_http_request"), ("iPhone", "i_phone"), ("v2Api", "v2_api"), ("a1b2C3", "a1b2_c3"),
        ("loadIO2Buffer", "load_io2_buffer"), ("IOError", "io_error"), ("simpleXMLToJSON", "simple_xml_to_json"),
    ]:
        expect(name, want)

    segments = [
        lambda: "".join(rng.choice(lower) for _ in range(rng.randint(1, 6))),
        lambda: rng.choice(upper) + "".join(rng.choice(lower) for _ in range(rng.randint(0, 5))),
        lambda: "".join(rng.choice(upper) for _ in range(rng.randint(2, 4))),
        lambda: "".join(rng.choice(digits) for _ in range(rng.randint(1, 3))),
    ]
    for _ in range(3000):
        name = rng.choice(segments[:3])()
        for _ in range(rng.randint(0, 5)):
            name += rng.choice(segments)()
        expect(name, reference(name))

    for value in ["", "1abc", "9", "a_b", "snake_case", "a-b", "a b", "with space", "é", "café", "ab\n", " ab", "a.b", "_private", "Ａbc"]:
        expect_error(value, ValueError)
    for value in [None, 5, b"parseJson", ["parseJson"]]:
        expect_error(value, TypeError)


_oracle()
