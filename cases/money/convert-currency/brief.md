Write a Python function convert(amount, source, target, rate) that converts an amount of money between currencies whose minor units differ.

- amount is an int in minor units of the source currency, with abs(amount) at most 10**15. The currencies and their decimals are: "JPY" 0 (whole yen), "USD" 2 (cents), "EUR" 2 (cents) and "KWD" 3 (fils). source and target are one of these codes, written exactly as shown.
- rate is a string giving how many units of the target currency one unit of the source currency buys. It is one or more ASCII digits, optionally followed by "." and one or more ASCII digits, such as "151.37", "0.0066" or "1", with no sign, exponent, spaces or other characters. Its value must be greater than zero.
- The exact result is amount / 10**(source decimals) * rate * 10**(target decimals), in minor units of the target. Round it to the nearest integer, with exact halves rounded away from zero: 0.5 becomes 1, 2.5 becomes 3, -0.5 becomes -1 and -2.5 becomes -3.
- The result must be exact for every allowed input, which floating-point arithmetic cannot guarantee. Return an int.
- Examples: convert(1000, "USD", "JPY", "150") is 1500, convert(1500, "JPY", "USD", "0.0066") is 990, convert(12345, "EUR", "KWD", "0.3333") is 41146 (exactly 41145.885 fils), convert(50, "USD", "JPY", "1") is 1 and convert(-50, "USD", "JPY", "1") is -1.
- Raise ValueError for a currency code not in the list (including "usd" or "GBP"), a rate that does not follow the format ("1e3", "-1", ".5", "5.", " 1"), and a rate equal to zero ("0", "0.000").

Deliver the function in one fenced python code block. Use only the Python standard library.
