Write a Python function to_snake(name) that converts a camelCase or PascalCase identifier to snake_case.

name is a str. A valid name is made only of ASCII letters and digits and starts with a letter. The result is all lowercase, with words joined by single underscores. Word breaks follow these rules and no others:

- An uppercase letter that follows a lowercase letter or a digit starts a new word: "parseJson" becomes "parse_json", "ParseJson" becomes "parse_json" and "utf8Decode" becomes "utf8_decode".
- A run of two or more uppercase letters is an acronym. When the run is followed by a lowercase letter, its last uppercase letter starts the next word: "parseHTTPResponse" becomes "parse_http_response" and "HTMLParser" becomes "html_parser".
- An acronym at the end of the name, or followed by a digit, stays one word: "userID" becomes "user_id" and "HTTP2Server" becomes "http2_server".
- Digits never start a word; they stay with the characters before them: "base64Encode" becomes "base64_encode" and "version2" stays "version2".
- There is no exception for plurals: "userIDs" becomes "user_i_ds".
- A name that is already all lowercase is returned unchanged.
- Raise TypeError when name is not a str. Raise ValueError when name is empty, starts with a digit, or contains anything other than ASCII letters and digits, such as "_", "-", a space or "é".

Deliver the function in one fenced python code block. Use only the Python standard library.
