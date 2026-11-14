text = "name = demo\n\n; comment\n[server]\nhost = example.test\nport=8080\n# another\n[ paths ]\nroot = /srv/app\nroot = /srv/new\n"
assert parse_ini(text) == {"": {"name": "demo"}, "server": {"host": "example.test", "port": "8080"}, "paths": {"root": "/srv/new"}}
assert parse_ini("") == {}
assert parse_ini("[empty]\n") == {"empty": {}}
assert parse_ini("[a]\nurl = http://x.test/?q=1\n") == {"a": {"url": "http://x.test/?q=1"}}
assert parse_ini("[a]\nx = 1\n[b]\n[a]\ny = 2") == {"a": {"x": "1", "y": "2"}, "b": {}}
for bad in ["just text", "[]", "= value", "[open"]:
    try:
        parse_ini(bad)
    except ValueError:
        continue
    raise AssertionError(f"parse_ini({bad!r}) did not raise ValueError")
