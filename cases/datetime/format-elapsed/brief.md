Write a Python function format_elapsed(seconds) that formats an elapsed time, given as a whole number of seconds, as days, hours, minutes and seconds.

- seconds is an int of 0 or more.
- Under one day, return "HH:MM:SS", with hours, minutes and seconds each written as exactly two digits: 0 is "00:00:00", 59 is "00:00:59", 3661 is "01:01:01" and 86399 is "23:59:59".
- From one day up, put the number of whole days in front, without padding, followed by "d" and one space: 86400 is "1d 00:00:00", 90061 is "1d 01:01:01" and 864000 is "10d 00:00:00".
- There is no upper limit, and the arithmetic must be exact for any size of int: 10**15 is "11574074074d 01:46:40".
- Return a str.
- Raise TypeError when seconds is not an int or is a bool, and ValueError when it is negative.

Deliver the function in one fenced python code block. Use only the Python standard library.
