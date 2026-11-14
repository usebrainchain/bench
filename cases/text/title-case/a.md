```javascript
const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "up"]);

function titleCase(text) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  const words = text.split(" ").filter(Boolean);
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (SMALL_WORDS.has(lower) && i > 0 && i < words.length - 1) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
```

`titleCase` follows every rule in the brief: small words stay lowercase except in first and last position, every other word is capitalised, and extra spaces are dropped.
