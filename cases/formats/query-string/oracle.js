{
  const show = (value) => JSON.stringify(value);
  const shaped = (value) => Array.isArray(value) && value.every((pair) => Array.isArray(pair) && pair.length === 2 && typeof pair[0] === "string" && typeof pair[1] === "string");
  const expect = (query, want) => {
    const got = parseQuery(query);
    if (!shaped(got) || show(got) !== show(want)) throw new Error(`parseQuery(${show(query)}) returned ${show(got)}, expected ${show(want)}`);
  };
  const expectError = (query) => {
    let got;
    try {
      got = parseQuery(query);
    } catch (error) {
      if (error instanceof URIError) return;
      throw new Error(`parseQuery(${show(query)}) threw ${error}, expected URIError`);
    }
    throw new Error(`parseQuery(${show(query)}) returned ${show(got)}, expected URIError`);
  };

  const fixed = [
    ["", []], ["?", []], ["&", []], ["?&&", []], ["a", [["a", ""]]], ["a=", [["a", ""]]], ["=", [["", ""]]],
    ["=1", [["", "1"]]], ["a=b=c", [["a", "b=c"]]], ["a==", [["a", "="]]], ["?a=1", [["a", "1"]]], ["??a=1", [["?a", "1"]]],
    ["a=1&&b=2&", [["a", "1"], ["b", "2"]]], ["a+b%20c=d", [["a b c", "d"]]], ["x=%2B", [["x", "+"]]], ["x=%2b%2B+", [["x", "++ "]]],
    ["x=S%C3%A3o", [["x", "São"]]], ["x=s%c3%a3o", [["x", "são"]]], ["x=%E2%82%AC", [["x", "€"]]], ["x=%F0%9F%98%80", [["x", "😀"]]],
    ["%26=%3D", [["&", "="]]], ["x=a%26b&y=%3F", [["x", "a&b"], ["y", "?"]]], ["x=é€", [["x", "é€"]]], ["x=a?b", [["x", "a?b"]]],
    ["x=%25", [["x", "%"]]], ["x=%2525", [["x", "%25"]]], ["t=1&t=2&t=1", [["t", "1"], ["t", "2"], ["t", "1"]]],
    ["a=1&?b=2", [["a", "1"], ["?b", "2"]]], ["x=#y", [["x", "#y"]]], ["++=++", [["  ", "  "]]],
  ];
  for (const [query, want] of fixed) expect(query, want);
  for (const query of ["%", "%4", "%zz", "x=%", "x=%4", "x=%G0", "x=%FF", "x=%E2%82", "x=%C0%AF", "x=%80", "x=%E2%28%A1",
    "x=%F0%9F%98", "%FF=1", "a=1&b=%zz", "x=%%41", "x=%2"]) expectError(query);

  let seed = 3986;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const utf8 = (codePoint) => {
    if (codePoint < 0x80) return [codePoint];
    if (codePoint < 0x800) return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 63)];
    if (codePoint < 0x10000) return [0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 63), 0x80 | (codePoint & 63)];
    return [0xf0 | (codePoint >> 18), 0x80 | ((codePoint >> 12) & 63), 0x80 | ((codePoint >> 6) & 63), 0x80 | (codePoint & 63)];
  };
  const escape = (char) => utf8(char.codePointAt(0)).map((byte) => {
    const hex = byte.toString(16).padStart(2, "0");
    return "%" + (next(2) ? hex.toUpperCase() : hex);
  }).join("");
  const pool = ["a", "Z", "0", " ", "&", "=", "+", "%", "#", "?", "é", "ß", "€", "😀", "/", "~", ".", "-", "_", "*"];
  const text = () => Array.from({ length: next(5) }, () => pool[next(pool.length)]).join("");
  const encode = (value, rawEquals) => {
    let out = "";
    for (const char of value) {
      if (char === " ") out += next(2) ? "+" : "%20";
      else if (char === "=" && rawEquals && next(2)) out += "=";
      else if ("&=+%#?".includes(char) || next(2)) out += escape(char);
      else out += char;
    }
    return out;
  };
  for (let round = 0; round < 3000; round++) {
    const want = [];
    const segments = [];
    for (let i = next(5); i > 0; i--) {
      const name = text();
      const value = text();
      want.push([name, value]);
      const withEquals = value !== "" || name === "" || next(2);
      segments.push(encode(name, false) + (withEquals ? "=" + encode(value, true) : ""));
      if (next(5) === 0) segments.push("");
    }
    expect((next(2) ? "?" : "") + segments.join("&"), want);
  }
}
