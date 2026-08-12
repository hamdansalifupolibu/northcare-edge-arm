from __future__ import annotations

import jwt

from northcare_api.auth.identity import VerifiedIdentity


class DevelopmentAccessTokenVerifier:
    id = "development"

    def __init__(self, secret: str) -> None:
        self._secret = secret

    async def verify(self, token: str) -> VerifiedIdentity:
        try:
            payload = jwt.decode(token, self._secret, algorithms=["HS256"])
        except jwt.PyJWTError as exc:
            raise PermissionError("AUTH_REQUIRED") from exc
        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise PermissionError("AUTH_REQUIRED")
        issued_at = payload.get("iat")
        token_issued_at = int(issued_at) if isinstance(issued_at, (int, float)) else None
        return VerifiedIdentity(
            subject=subject,
            issuer="development",
            email=payload.get("email"),
            token_issued_at=token_issued_at,
        )
