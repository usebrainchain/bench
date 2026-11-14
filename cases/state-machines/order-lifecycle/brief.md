Write a Python function apply_events(events) that runs an order through its lifecycle and reports where it ends up.

events is a list of str. The order starts in the state "created". Apply the events in order using this table; a state and event pair that is not listed has no transition.

- created, pay: paid
- created, cancel: cancelled
- paid, ship: shipped
- paid, cancel: refunded (cancelling a paid order refunds it)
- paid, refund: refunded
- shipped, deliver: delivered
- delivered, refund: refunded

cancelled and refunded are final: no event moves an order out of them. A refund while shipped has no transition.

Return a tuple (state, log). state is the final state as a str. log is a list with one str per event, in order:
- for an event with a transition, "<from> -> <to>", such as "created -> paid";
- for a known event with no transition from the current state, "ignored <event> in <state>", such as "ignored ship in created" or "ignored refund in shipped". The state does not change.

The known events are exactly pay, ship, deliver, cancel and refund, in lowercase. Raise ValueError for any other event, in every state including the final ones: apply_events(["cancel", "archive"]) raises ValueError, and so does apply_events(["Pay"]).

Example: apply_events(["ship", "pay", "ship", "refund", "deliver"]) returns ("delivered", ["ignored ship in created", "created -> paid", "paid -> shipped", "ignored refund in shipped", "shipped -> delivered"]).

Deliver the function in one fenced python code block. Use only the Python standard library.
