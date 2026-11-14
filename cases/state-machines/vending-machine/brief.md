Write a JavaScript function vend(prices, events) that runs a coin-operated vending machine and returns its credit and everything it did.

prices is an object whose own keys are product codes such as "A1", each mapped to a price in cents; every price is a positive integer multiple of 5. events is an array of well-formed events, each one of:
- ["coin", value], where value is a number;
- ["select", code], where code is a string;
- ["cancel"].

The machine holds a credit in cents, starting at 0. It handles the events in order and appends outputs to a list:
- coin: the accepted coins are exactly 5, 10, 25 and 100. An accepted coin adds its value to the credit. Any other value is returned at once as the output {type: "return", coins: [value]}, and the credit does not change. The credit never exceeds 500: an accepted coin that would take it above 500 is also returned at once in the same way. So 495 plus a 10 returns the 10, while 400 plus a 100 reaches 500 and is kept.
- select: if code is not one of the own keys of prices, output {type: "error", reason: "unknown"}. Otherwise, if the credit is below the price, output {type: "error", reason: "insufficient"} and keep the credit. Otherwise output {type: "dispense", product: code}, then return the change (credit minus price) if it is above 0, and set the credit to 0.
- cancel: return the whole credit if it is above 0 and set the credit to 0. With no credit, cancel outputs nothing.

Change is returned as one output {type: "return", coins: [...]} using the fewest coins: take the largest coin first from 100, 25, 10 and 5, and list the coins largest first. 125 cents is [100, 25] and 40 cents is [25, 10, 5].

Return an object with exactly two properties: credit, the final credit as a number, and outputs, the array of output objects in order. Each output object has exactly the properties shown above. Do not modify prices or events.

Example: vend({A1: 75}, [["coin", 100], ["coin", 3], ["select", "A1"]]) returns {credit: 0, outputs: [{type: "return", coins: [3]}, {type: "dispense", product: "A1"}, {type: "return", coins: [25]}]}.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
