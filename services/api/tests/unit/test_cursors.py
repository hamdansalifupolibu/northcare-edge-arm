from northcare_api.security.cursors import CursorCodec, SyncCursor


def test_cursor_roundtrip_and_scope() -> None:
    codec = CursorCodec("secret")
    cursor = SyncCursor(
        sequence=12,
        account_id="dev-worker-001",
        organisation_id="org-dev-001",
        facility_id="fac-dev-001",
        role="worker",
    )
    token = codec.encode(cursor)
    decoded = codec.decode(
        token,
        account_id="dev-worker-001",
        organisation_id="org-dev-001",
        facility_id="fac-dev-001",
        role="worker",
    )
    assert decoded == cursor
    assert token.count(".") == 1


def test_cursor_rejects_scope_mismatch() -> None:
    codec = CursorCodec("secret")
    token = codec.encode(SyncCursor(1, "a", "o", "f", "worker"))
    try:
        codec.decode(token, account_id="other", organisation_id="o", facility_id="f", role="worker")
        assert False, "expected failure"
    except ValueError as exc:
        assert str(exc) == "CURSOR_INVALID"


def test_cursor_roundtrip_across_many_sequences() -> None:
    """HMAC digests may contain 0x2e; delimiter must remain outside binary bytes."""
    codec = CursorCodec("test-cursor-secret-at-least-32-bytes")
    for sequence in range(1, 64):
        cursor = SyncCursor(sequence, "dev-worker-001", "org-dev-001", "fac-dev-001", "worker")
        token = codec.encode(cursor)
        assert (
            codec.decode(
                token,
                account_id="dev-worker-001",
                organisation_id="org-dev-001",
                facility_id="fac-dev-001",
                role="worker",
            )
            == cursor
        )
