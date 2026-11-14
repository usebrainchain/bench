{
  const valid = [["0", 0], ["42", 42], ["-17", -17], ["007", 7], ["9007199254740991", 9007199254740991], ["-9007199254740991", -9007199254740991]];
  for (const [text, want] of valid) {
    const got = parseSafeInteger(text);
    if (got !== want) throw new Error(`parseSafeInteger(${JSON.stringify(text)}) returned ${got}, expected ${want}`);
  }
  const throwsA = (Kind, value) => {
    try {
      parseSafeInteger(value);
    } catch (error) {
      if (error instanceof Kind) return;
      throw new Error(`parseSafeInteger(${JSON.stringify(value)}) threw ${error.name}, expected ${Kind.name}`);
    }
    throw new Error(`parseSafeInteger(${JSON.stringify(value)}) did not throw ${Kind.name}`);
  };
  for (const text of ["", "12a", "1e3", " 12", "1.0", "0x1F"]) throwsA(SyntaxError, text);
  for (const text of ["9007199254740992", "-9007199254740992", "1" + "0".repeat(30)]) throwsA(RangeError, text);
  throwsA(TypeError, 12);
  throwsA(TypeError, null);
}
