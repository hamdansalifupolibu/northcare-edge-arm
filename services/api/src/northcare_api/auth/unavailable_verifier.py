from __future__ import annotations

from northcare_api.auth.identity import VerifiedIdentity


class UnavailableAccessTokenVerifier:
    id = "unavailable"

    async def verify(self, token: str) -> VerifiedIdentity:
        _ = token
        raise PermissionError("AUTH_UNAVAILABLE")
