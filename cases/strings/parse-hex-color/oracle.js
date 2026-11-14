{
  const VALUES = "0123456789abcdef";
  const reference = (digits) => {
    const nibbles = [...digits.toLowerCase()].map((c) => VALUES.indexOf(c));
    const bytes = nibbles.length <= 4 ? nibbles.map((n) => n * 17) : nibbles.filter((_, i) => i % 2 === 0).map((n, i) => n * 16 + nibbles[2 * i + 1]);
    const alpha = bytes.length === 4 ? bytes[3] : 255;
    return { r: bytes[0], g: bytes[1], b: bytes[2], a: Math.round((alpha * 1000) / 255) / 1000 };
  };
  const show = (value) => (typeof value === "string" ? JSON.stringify(value) : String(value));
  const expectColor = (text, want) => {
    const got = parseHexColor(text);
    if (got === null || typeof got !== "object" || Object.getPrototypeOf(got) !== Object.prototype) throw new Error(`parseHexColor(${show(text)}) did not return a plain object`);
    const keys = Object.keys(got).sort().join(",");
    if (keys !== "a,b,g,r" || !["r", "g", "b", "a"].every((key) => Object.is(got[key], want[key]))) {
      throw new Error(`parseHexColor(${show(text)}) returned ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    }
  };
  const expectThrow = (value, type) => {
    let error;
    try {
      parseHexColor(value);
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof type)) throw new Error(`parseHexColor(${show(value)}) ${error ? `threw ${error.name}` : "did not throw"}, expected ${type.name}`);
  };

  const fixed = [
    ["#ff8800", { r: 255, g: 136, b: 0, a: 1 }], ["#f80", { r: 255, g: 136, b: 0, a: 1 }],
    ["#F80", { r: 255, g: 136, b: 0, a: 1 }], ["#ff000080", { r: 255, g: 0, b: 0, a: 0.502 }],
    ["#0000", { r: 0, g: 0, b: 0, a: 0 }], ["#000", { r: 0, g: 0, b: 0, a: 1 }],
    ["#FfA0c8", { r: 255, g: 160, b: 200, a: 1 }], ["#123", { r: 17, g: 34, b: 51, a: 1 }],
    ["#1234", { r: 17, g: 34, b: 51, a: 0.267 }], ["#01020304", { r: 1, g: 2, b: 3, a: 0.016 }],
    ["#ffffffff", { r: 255, g: 255, b: 255, a: 1 }], ["#abcdef00", { r: 171, g: 205, b: 239, a: 0 }],
    ["#fff8", { r: 255, g: 255, b: 255, a: 0.533 }],
  ];
  for (const [text, want] of fixed) expectColor(text, want);

  let seed = 914237;
  const next = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const digitChars = "0123456789abcdefABCDEF";
  const noise = ["g", "G", " ", "\n", "\t", "x", "#", "-", "+", ".", "ｆ", "İ", "z"];
  for (let i = 0; i < 4000; i++) {
    const length = [3, 4, 6, 8][next(4)];
    const digits = Array.from({ length }, () => digitChars[next(digitChars.length)]).join("");
    expectColor(`#${digits}`, reference(digits));
    const at = next(digits.length + 2);
    const text = `#${digits}`;
    expectThrow(text.slice(0, at) + noise[next(noise.length)] + text.slice(at), SyntaxError);
    expectThrow(digits, SyntaxError);
  }
  for (const length of [0, 1, 2, 5, 7, 9, 10, 12, 16]) {
    expectThrow(`#${"a".repeat(length)}`, SyntaxError);
    expectThrow(`#${"7".repeat(length)}`, SyntaxError);
  }
  for (const text of ["", "#", "ff8800", "#ff", "#ff888", "#ff8800f", "#ggg", "#ff 800", " #fff", "#fff ", "#fff\n", "\n#fff", "0xfff", "##fff", "#ｆｆｆ", "#f f", "#fff;"]) {
    expectThrow(text, SyntaxError);
  }
  for (const value of [null, undefined, 0xfff, ["#fff"], { toString: () => "#fff" }, true]) expectThrow(value, TypeError);
}
