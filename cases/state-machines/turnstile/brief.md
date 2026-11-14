Write a Python function turnstile(events) that simulates a coin-operated turnstile with an alarm.

events is a list of str, each "coin", "push" or "reset". The turnstile starts "locked" with a failure count of 0. Each event produces exactly one output str, by this table:

- locked, coin: becomes "unlocked", outputs "unlock", and the failure count goes back to 0.
- locked, push: stays locked, adds 1 to the failure count and outputs "deny". When this push makes the count 3, the turnstile becomes "alarm" and outputs "alarm" instead of "deny".
- unlocked, push: becomes "locked" and outputs "lock".
- unlocked, coin: stays unlocked and outputs "refund".
- alarm, coin: stays in alarm and outputs "refund".
- alarm, push: stays in alarm and outputs "deny".
- any state, reset: becomes "locked", outputs "reset", and the failure count goes back to 0.

The failure count changes only as stated. A coin while locked clears it, so failed pushes before a paid entry never count toward the alarm: turnstile(["push", "push", "coin", "push", "push"]) returns ("locked", ["deny", "deny", "unlock", "lock", "deny"]).

Return a tuple (state, outputs): the final state, which is "locked", "unlocked" or "alarm", and the list of outputs in order. Raise ValueError for any event other than the three named, such as "kick" or "Coin".

Deliver the function in one fenced python code block. Use only the Python standard library.
