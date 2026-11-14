I implemented `truncate(text, limit)` to the brief.

It first validates its arguments: a non-string `text` throws a TypeError, and a `limit` that is not an integer of at least 4 throws a RangeError. If the text already fits within `limit` it is returned unchanged.

Otherwise it reserves three characters for the "..." marker and looks for the last space at or before position `limit - 3`. It keeps everything before that space, removes trailing spaces from the kept part, and appends "...". Spaces inside the kept part are left alone. When the first word is longer than the available room, it falls back to the first `limit - 3` characters plus "...".

I checked it against every example in the brief, including "The quick brown fox" at 12, "one  two  three" at 11 and "Supercalifragilistic is long" at 10, and all of them return the expected strings.
