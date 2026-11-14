def _oracle():
    import random

    rng = random.Random(9031)

    for capacity in [0, -1, -10]:
        try:
            LRUCache(capacity)
        except ValueError:
            continue
        except Exception as other:
            raise AssertionError(f"LRUCache({capacity}) raised {type(other).__name__}, expected ValueError")
        raise AssertionError(f"LRUCache({capacity}) did not raise ValueError")

    cache = LRUCache(2)
    cache.put("a", 1)
    cache.put("b", 2)
    cache.put("a", 10)
    cache.put("c", 3)
    got = cache.get("a")
    assert got == 10, f"put a, b, a=10, c into capacity 2: get('a') returned {got!r}, expected 10"
    got = cache.get("b")
    assert got is None, f"put a, b, a=10, c into capacity 2: get('b') returned {got!r}, expected None"

    keys = [0, 1, 2, 3, 4, 5, "a", "b", (1, 2)]
    for _ in range(400):
        capacity = rng.randint(1, 5)
        cache = LRUCache(capacity)
        order = []
        values = {}
        log = [f"LRUCache({capacity})"]
        for _ in range(60):
            roll = rng.random()
            key = rng.choice(keys)
            if roll < 0.45:
                value = rng.randint(-1000, 1000)
                log.append(f"put({key!r}, {value})")
                cache.put(key, value)
                if key in values:
                    order.remove(key)
                elif len(order) == capacity:
                    del values[order.pop(0)]
                order.append(key)
                values[key] = value
            elif roll < 0.9:
                log.append(f"get({key!r})")
                got = cache.get(key)
                want = values.get(key)
                if key in values:
                    order.remove(key)
                    order.append(key)
                assert got == want and type(got) is type(want), f"after {'; '.join(log[-10:])}: returned {got!r}, expected {want!r}"
            else:
                log.append("len()")
                got = len(cache)
                assert got == len(order), f"after {'; '.join(log[-10:])}: returned {got!r}, expected {len(order)}"


_oracle()
