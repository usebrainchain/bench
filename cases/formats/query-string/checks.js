{
  const cases = [
    ["?a=1&b=2", [["a", "1"], ["b", "2"]]],
    ["", []],
    ["name=Ada+Lovelace&city=S%C3%A3o%20Paulo", [["name", "Ada Lovelace"], ["city", "São Paulo"]]],
    ["tag=x&tag=y", [["tag", "x"], ["tag", "y"]]],
    ["flag&x=", [["flag", ""], ["x", ""]]],
    ["a=1&&b=2", [["a", "1"], ["b", "2"]]],
    ["plus=%2B1", [["plus", "+1"]]],
  ];
  for (const [query, want] of cases) {
    const got = parseQuery(query);
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`parseQuery(${JSON.stringify(query)}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  }
  for (const bad of ["a=%zz", "a=%E2%82"]) {
    let threw = false;
    try {
      parseQuery(bad);
    } catch (error) {
      if (!(error instanceof URIError)) throw new Error(`parseQuery(${JSON.stringify(bad)}) threw ${error}, expected URIError`);
      threw = true;
    }
    if (!threw) throw new Error(`parseQuery(${JSON.stringify(bad)}) did not throw URIError`);
  }
}
