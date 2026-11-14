{
  const item = (key, value) => ({ key, value });
  const values = (list) => list.map((element) => element.value).join(",");
  const expect = (lists, want) => {
    const got = mergeSorted(lists);
    if (!Array.isArray(got) || values(got) !== want) throw new Error(`mergeSorted returned ${JSON.stringify(got)}, expected values ${want}`);
  };
  expect([], "");
  expect([[], []], "");
  expect([[item(1, "a"), item(4, "d")], [item(2, "b"), item(3, "c")]], "a,b,c,d");
  expect([[item(1, "a"), item(5, "e"), item(9, "i")], [item(2, "b"), item(3, "c")]], "a,b,c,e,i");
  expect([[item(-3, "x")], [], [item(0.5, "y"), item(7, "z")]], "x,y,z");
  const input = [[item(2, "b")], [item(1, "a")]];
  const got = mergeSorted(input);
  if (got === input[0] || got === input[1] || got[0] !== input[1][0]) throw new Error("mergeSorted must return a new array of the same objects");
}
