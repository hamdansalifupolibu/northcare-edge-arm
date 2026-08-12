from __future__ import annotations

from northcare_api.auth.identity import VerifiedIdentity


class FirebaseAccessTokenVerifier:
    """Boundary for Firebase ID token verification. May be unconfigured."""

    id = "firebase"

    def __init__(self, project_id: str, credentials_path: str) -> None:
        self._project_id = project_id
        self._credentials_path = credentials_path
        self._initialized = False

    def _ensure_initialized(self) -> None:
        if self._initialized:
            return
        if not self._project_id or not self._credentials_path:
            raise PermissionError("AUTH_UNAVAILABLE")
        try:
            import firebase_admin
            from firebase_admin import credentials
        except ImportError as exc:
            raise PermissionError("AUTH_UNAVAILABLE") from exc
        if not firebase_admin._apps:
            cred = credentials.Certificate(self._credentials_path)
            firebase_admin.initialize_app(cred, {"projectId": self._project_id})
        self._initialized = True

    async def verify(self, token: str) -> VerifiedIdentity:
        self._ensure_initialized()
        try:
            from firebase_admin import auth
        except ImportError as exc:
            raise PermissionError("AUTH_UNAVAILABLE") from exc
        try:
            decoded = auth.verify_id_token(token)
        except Exception as exc:
            raise PermissionError("AUTH_REQUIRED") from exc
        subject = decoded.get("uid") or decoded.get("sub")
        if not isinstance(subject, str) or not subject:
            raise PermissionError("AUTH_REQUIRED")
        email = decoded.get("email")
        return VerifiedIdentity(
            subject=subject,
            issuer="firebase",
            email=email if isinstance(email, str) else None,
        )
