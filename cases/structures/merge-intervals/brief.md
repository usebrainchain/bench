Write a JavaScript function mergeIntervals(intervals) that merges overlapping closed intervals.

- intervals is an array of pairs [start, end] of integers with start <= end, in any order. Integers may be negative. The array may be empty, and the same pair may appear more than once.
- Intervals are closed, so two intervals merge when they overlap or touch at an endpoint: [1, 3] and [3, 5] become [1, 5]. Intervals separated by any gap stay apart: [1, 2] and [3, 4] are not merged.
- An interval inside another disappears into it: [1, 10] and [2, 3] become [1, 10].
- Return a new array of new [start, end] pairs, sorted by start, in which no two intervals overlap or touch. mergeIntervals([[5, 6], [1, 3], [2, 4]]) returns [[1, 4], [5, 6]], and an empty input returns [].
- Do not modify the input: the outer array keeps its order and length, and every input pair keeps its values. No returned pair may be the same array object as an input pair.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
