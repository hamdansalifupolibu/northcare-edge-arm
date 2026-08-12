import asyncio

import jwt
import pytest

from northcare_api.auth.deps import build_access_token_verifier
from northcare_api.auth.development_verifier import DevelopmentAccessTokenVerifier
from northcare_api.auth.unavailable_verifier import UnavailableAccessTokenVerifier
from northcare_api.config import Settings


def test_development_verifier_accepts_valid_token() -> None:
    secret = "unit-test-dev-secret-at-least-32b"
    verifier = DevelopmentAccessTokenVerifier(secret)
    token = jwt.encode({"sub": "dev-worker-001"}, secret, algorithm="HS256")
    identity = asyncio.run(verifier.verify(token))
    assert identity.subject == "dev-worker-001"


def test_unavailable_fail_closed() -> None:
    verifier = UnavailableAccessTokenVerifier()
    with pytest.raises(PermissionError, match="AUTH_UNAVAILABLE"):
        asyncio.run(verifier.verify("anything"))


def test_production_without_firebase_is_unavailable() -> None:
    settings = Settings(
        NORTHCARE_ENV="production",
        FIREBASE_PROJECT_ID="",
        GOOGLE_APPLICATION_CREDENTIALS="",
    )
    verifier = build_access_token_verifier(settings)
    assert verifier.id == "unavailable"
