Write a JavaScript function mergeSorted(lists) that merges several sorted lists into one sorted list and keeps ties in a fixed order.

- lists is an array of arrays. It may be empty, and any inner array may be empty. Each element is an object { key, value } whose key is a finite number. Each inner array is already sorted by key in non-decreasing order.
- Return a new array holding every element of every inner array, as the same object references, sorted by key in non-decreasing order.
- Elements with equal keys keep a fixed order: an element from an earlier inner array comes before one from a later inner array, and elements from the same inner array keep their original order. For example, with a1 = { key: 1, value: "a" }, b1 = { key: 1, value: "b" }, c2 = { key: 2, value: "c" } and d1 = { key: 1, value: "d" }, mergeSorted([[a1], [b1, c2], [d1]]) is [a1, b1, d1, c2].
- mergeSorted([]) is [] and mergeSorted([[], []]) is [].
- Do not modify lists, its inner arrays or the elements.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
