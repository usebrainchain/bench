Both functions are done.

`to_roman` validates that `n` is a real int (bools are rejected explicitly, since `bool` subclasses `int`) and lies between 1 and 3999, then walks a table of the thirteen value and symbol pairs from 1000 ("M") down to 1 ("I"), including the six subtractive pairs, appending each symbol as many times as it fits and subtracting its value.

`from_roman` checks that it was given a str, then validates the whole string against the standard pattern: up to three M, then CM, CD or an optional D with up to three C, then the same shape for the tens with XC, XL, L and X, then for the ones with IX, IV, V and I. A string that does not match exactly, or that is empty, raises ValueError, which rules out "IIII", "VX", "IC", lowercase and spaces. A matching string is converted by adding each symbol's value and subtracting it when a larger symbol follows.

I ran both directions over all 3999 values and every invalid example in the brief, and they behave as specified.
