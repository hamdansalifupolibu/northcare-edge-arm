from northcare_api.security.hashing import request_hash


def test_request_hash_stable() -> None:
    a = request_hash({"b": 1, "a": 2})
    b = request_hash({"a": 2, "b": 1})
    assert a == b
    assert len(a) == 64
