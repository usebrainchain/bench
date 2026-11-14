```javascript
function turnstile(events) {
  let state = "locked";
  let failures = 0;
  const outputs = [];
  for (const event of events) {
    if (event === "reset") {
      state = "locked";
      failures = 0;
      outputs.push("reset");
    } else if (event === "coin") {
      if (state === "locked") {
        state = "unlocked";
        failures = 0;
        outputs.push("unlock");
      } else {
        outputs.push("refund");
      }
    } else if (event === "push") {
      if (state === "unlocked") {
        state = "locked";
        outputs.push("lock");
      } else if (state === "alarm") {
        outputs.push("deny");
      } else {
        failures += 1;
        if (failures === 3) {
          state = "alarm";
          outputs.push("alarm");
        } else {
          outputs.push("deny");
        }
      }
    } else {
      throw new RangeError(`unknown event: ${event}`);
    }
  }
  return [state, outputs];
}
```

I wrote this in JavaScript so the same code can run on the gate controller and in the operations dashboard. It follows the transition table exactly, including clearing the failure count on a paid unlock.
