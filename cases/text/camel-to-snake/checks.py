assert to_snake("parseJson") == "parse_json"
assert to_snake("ParseJson") == "parse_json"
assert to_snake("parseHTTPResponse") == "parse_http_response"
assert to_snake("HTMLParser") == "html_parser"
assert to_snake("userID") == "user_id"
assert to_snake("lowercase") == "lowercase"
for bad in ["", "1abc", "snake_case", "with space"]:
    try:
        to_snake(bad)
    except ValueError:
        continue
    raise AssertionError(f"to_snake({bad!r}) did not raise ValueError")
