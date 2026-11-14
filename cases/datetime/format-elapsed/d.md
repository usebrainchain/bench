```python
def format_elapsed(seconds):
    if type(seconds) is not int:
        raise TypeError("expected an int number of seconds")
    if seconds < 0:
        raise ValueError("expected a non-negative number of seconds")
    days = seconds // 86400
    hours = seconds // 3600 % 24
    minutes = seconds // 60 % 60
    clock = "{:02}:{:02}:{:02}".format(hours, minutes, seconds % 60)
    if days == 0:
        return clock
    return "{}d {}".format(days, clock)
```
