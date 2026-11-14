def _oracle():
    import random

    rng = random.Random(1114)

    def expect(text, want):
        got = parse_ini(text)
        shaped = type(got) is dict and all(
            type(name) is str and type(section) is dict and all(type(k) is str and type(v) is str for k, v in section.items())
            for name, section in got.items()
        )
        assert shaped and got == want, f"parse_ini({text!r}) returned {got!r}, expected {want!r}"

    def expect_error(text):
        try:
            got = parse_ini(text)
        except ValueError:
            return
        raise AssertionError(f"parse_ini({text!r}) returned {got!r}, expected ValueError")

    for text, want in [
        ("", {}), ("\n\n", {}), ("; only a comment\n# and another", {}), ("[a]\n", {"a": {}}), ("[a]", {"a": {}}),
        ("k=v", {"": {"k": "v"}}), ("k =", {"": {"k": ""}}), ("k=", {"": {"k": ""}}), ("k = =x", {"": {"k": "=x"}}),
        ("path = a;b # c", {"": {"path": "a;b # c"}}), ("[s]\nk = ;x", {"s": {"k": ";x"}}), ("[s]\nk = #x", {"s": {"k": "#x"}}),
        ("  \t[ server ]\t \n\thost\t=\texample.test  ", {"server": {"host": "example.test"}}),
        ("[S]\nK=1\n[s]\nk=2", {"S": {"K": "1"}, "s": {"k": "2"}}), ("k=1\nk=2", {"": {"k": "2"}}),
        ("url = http://h.test/?a=b", {"": {"url": "http://h.test/?a=b"}}), ("[a.b]\nmy key = some value", {"a.b": {"my key": "some value"}}),
        ("[a]\n[a]\n", {"a": {}}), ("[a]\nx=1\n[b]\n[a]\nx=3", {"a": {"x": "3"}, "b": {}}), ("[a]]\nk=v", {"a]": {"k": "v"}}),
        ("k=v\n[a]\n", {"": {"k": "v"}, "a": {}}), ("\t; indented comment\nk = v ; not a comment", {"": {"k": "v ; not a comment"}}),
        ("[x]\nk = a\tb", {"x": {"k": "a\tb"}}), ("[x]\nk;1 = v", {"x": {"k;1": "v"}}), ("[x]\nk#1 = v#2", {"x": {"k#1": "v#2"}}),
    ]:
        expect(text, want)

    for text in ["just text", "[]", "[  ]", "[ \t ]", "[a] x", "[a", "a]", "= value", " = 1", "\t=", "=",
                 "[a]\nnoequals", "[a]\nk=v\n[", "k=v\n[b] c", "[a]\n = x"]:
        expect_error(text)

    names = ["a", "server", "Server", "x y", "a.b", "db-1", "ünï"]
    keys = ["host", "Host", "port", "my key", "a.b", "x_1", "k;", "k#", "url", "k[0]"]
    pieces = ["a", "b", " ", "=", ";", "#", "[", "]", "x", "1", "\t", "é"]

    def space():
        return "".join(rng.choice(" \t") for _ in range(rng.randint(0, 2)))

    for _ in range(1500):
        lines, want, current = [], {}, ""
        for _ in range(rng.randint(0, 12)):
            roll = rng.random()
            if roll < 0.15:
                lines.append(space())
            elif roll < 0.3:
                lines.append(space() + rng.choice(";#") + "".join(rng.choice(pieces) for _ in range(rng.randint(0, 5))))
            elif roll < 0.5:
                current = rng.choice(names)
                want.setdefault(current, {})
                lines.append(space() + "[" + space() + current + space() + "]" + space())
            else:
                key = rng.choice(keys)
                value = "".join(rng.choice(pieces) for _ in range(rng.randint(0, 6)))
                want.setdefault(current, {})[key] = value.strip(" \t")
                lines.append(space() + key + space() + "=" + space() + value + space())
        expect("\n".join(lines), want)


_oracle()
