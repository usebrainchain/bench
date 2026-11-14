{
  const cases = [
    ["#ff8800", { r: 255, g: 136, b: 0, a: 1 }],
    ["#f80", { r: 255, g: 136, b: 0, a: 1 }],
    ["#FF000080", { r: 255, g: 0, b: 0, a: 0.502 }],
    ["#0000", { r: 0, g: 0, b: 0, a: 0 }],
  ];
  for (const [text, want] of cases) {
    const got = parseHexColor(text);
    const same = got && Object.keys(got).length === 4 && ["r", "g", "b", "a"].every((key) => got[key] === want[key]);
    if (!same) throw new Error(`parseHexColor(${text}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  }
  for (const bad of ["ff8800", "#ff888", "#ggg", "#ff8800ff00"]) {
    let threw = false;
    try {
      parseHexColor(bad);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      threw = true;
    }
    if (!threw) throw new Error(`parseHexColor(${bad}) did not throw a SyntaxError`);
  }
}
