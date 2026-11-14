I implemented `duration_ms` with a single anchored regular expression over the restricted ISO 8601 grammar: an optional days group, then an optional `T` section with hours, minutes and seconds in that order. Only the seconds group allows a fraction of one to three digits, which is right-padded with zeros to milliseconds, so `PT1.5S` gives 1500 and `PT0.001S` gives 1.

After the match, the function refuses a bare `P`, a bare `PT` and a dangling `T`, and anything the pattern does not cover (years, months, weeks, commas, lowercase letters, signs, whitespace) raises `ValueError`. Days are converted at exactly 86,400 seconds, and the result is always an `int`.

I ran it against every example in the brief plus about forty invalid strings, and all of them behave as specified. The function is ready to drop into your module.
