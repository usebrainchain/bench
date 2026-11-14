{
  const valid = [
    ["$1,234.56", 123456],
    ["-€0.50", -50],
    ["1234", 123400],
    ["£0", 0],
    ["1,000,000.01", 100000001],
    ["0.07", 7],
  ];
  for (const [text, want] of valid) {
    const got = parseMoney(text);
    if (got !== want) throw new Error(`parseMoney(${JSON.stringify(text)}) returned ${got}, expected ${want}`);
  }
  for (const text of ["", "1.5", "1.", "abc", "$-5", "1 234", "+5"]) {
    let error;
    try {
      parseMoney(text);
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof SyntaxError)) throw new Error(`parseMoney(${JSON.stringify(text)}) did not throw SyntaxError`);
  }
  let typeError;
  try {
    parseMoney(5);
  } catch (caught) {
    typeError = caught;
  }
  if (!(typeError instanceof TypeError)) throw new Error("parseMoney(5) did not throw TypeError");
}
