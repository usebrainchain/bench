Write a JavaScript function runs(values) that groups consecutive equal elements of an array into [value, count] pairs.

- values is an array without holes; its elements may be any values. Return a new array with one [value, count] pair for each run of consecutive equal elements, in order. runs(["a", "a", "b", "a"]) returns [["a", 2], ["b", 1], ["a", 1]], and runs([]) returns [].
- Two elements are equal when === says they are, with one exception: NaN equals NaN. So runs([NaN, NaN, 1]) returns [[NaN, 2], [1, 1]], and runs([0, -0]) returns [[0, 2]] because 0 === -0.
- Objects and arrays are equal only to themselves: two different empty objects are two runs, while the same object twice in a row is one run of 2.
- The value in each pair is the first element of its run. The count is a number.
- Do not modify values.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
