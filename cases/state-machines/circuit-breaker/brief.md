Write a Python function plan_retries(events) that drives a circuit breaker for calls to a flaky service and says what to do after each event.

events is a list of str: "ok" (a call succeeded), "fail" (a call failed) and "tick" (one second passed). The breaker starts "closed" with a failure count of 0. Each event produces exactly one action str, by this table.

closed:
- ok: outputs "pass" and sets the failure count to 0.
- fail: adds 1 to the failure count. At 1 it outputs "retry 100" and at 2 "retry 200" (milliseconds to wait before retrying). At 3 it outputs "trip" and the breaker becomes "open".
- tick: outputs "idle".

open (no calls are made):
- ok or fail: outputs "reject" and changes nothing.
- tick: the first tick after the breaker opened outputs "wait"; the second outputs "probe" and the breaker becomes "half-open".

half-open:
- ok: outputs "close"; the breaker becomes "closed" with a failure count of 0.
- fail: outputs "trip"; the breaker becomes "open" again and its two-tick wait starts over.
- tick: outputs "idle".

Only the events above change the failure count; a tick never resets it. For example, plan_retries(["fail", "tick", "fail", "fail"]) returns ("open", ["retry 100", "idle", "retry 200", "trip"]). After a failed probe the wait starts over: plan_retries(["fail", "fail", "fail", "tick", "tick", "fail", "tick", "tick"]) returns ("half-open", ["retry 100", "retry 200", "trip", "wait", "probe", "trip", "wait", "probe"]).

Return a tuple (state, actions): the final state, which is "closed", "open" or "half-open", and the list of actions in order. Raise ValueError for any other event, such as "error" or "OK".

Deliver the function in one fenced python code block. Use only the Python standard library.
