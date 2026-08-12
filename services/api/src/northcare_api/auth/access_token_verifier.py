from __future__ import annotations

from typing import Protocol

from northcare_api.auth.identity import VerifiedIdentity


class AccessTokenVerifier(Protocol):
    id: str

    async def verify(self, token: str) -> VerifiedIdentity: ...
