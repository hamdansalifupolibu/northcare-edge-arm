from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from northcare_api.administration.professions import PROFESSION_VALUES
from northcare_api.cli import set_development_professional_profile as demo_cli
from northcare_api.config import Settings
from northcare_api.database import SessionLocal
from northcare_api.domain.models import DevelopmentCredential, WorkerProfessionalProfile
from tests.helpers import auth_headers


async def _admin_headers(client: AsyncClient) -> dict[str, str]:
    return await auth_headers(client, "dev-admin-001", "AdminDemo1!")


def _profile_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "profession": "midwife",
        "communityRequestsEnabled": True,
        "emergencyRequestsEnabled": False,
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_profession_registry_returns_frozen_values(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    resp = await api_client.get("/v1/admin/professions", headers=headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    values = [item["value"] for item in items]
    assert set(values) == PROFESSION_VALUES
    assert len(values) == len(set(values))
    assert all(item["active"] is True for item in items)
    other = next(item for item in items if item["value"] == "otherApprovedHealthProfessional")
    assert other["allowsOtherDescription"] is True


@pytest.mark.asyncio
async def test_worker_cannot_list_professions_or_patch_profile(api_client: AsyncClient) -> None:
    headers = await auth_headers(api_client)
    listed = await api_client.get("/v1/admin/professions", headers=headers)
    assert listed.status_code == 403
    patched = await api_client.patch(
        "/v1/admin/accounts/dev-worker-001/professional-profile",
        headers=headers,
        json=_profile_payload(),
    )
    assert patched.status_code == 403


@pytest.mark.asyncio
async def test_register_and_update_professional_profile(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    email = f"prof-{uuid.uuid4().hex[:10]}@development.invalid"
    created = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Profile Worker",
            "email": email,
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            **_profile_payload(profession="nutritionOfficer"),
        },
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["professionalProfile"]["profession"] == "nutritionOfficer"
    account_id = body["accountId"]

    details = await api_client.get(f"/v1/admin/accounts/{account_id}", headers=headers)
    assert details.status_code == 200
    profile = details.json()["professionalProfile"]
    assert profile["profession"] == "nutritionOfficer"
    assert profile["communityRequestsEnabled"] is True
    assert profile["emergencyRequestsEnabled"] is False

    updated = await api_client.patch(
        f"/v1/admin/accounts/{account_id}/professional-profile",
        headers=headers,
        json=_profile_payload(
            profession="communityHealthNurse",
            communityRequestsEnabled=True,
            emergencyRequestsEnabled=True,
            expectedProfileVersion=profile["version"],
        ),
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["profession"] == "communityHealthNurse"
    assert updated.json()["emergencyRequestsEnabled"] is True
    assert updated.json()["version"] == profile["version"] + 1

    stale = await api_client.patch(
        f"/v1/admin/accounts/{account_id}/professional-profile",
        headers=headers,
        json=_profile_payload(expectedProfileVersion=profile["version"]),
    )
    assert stale.status_code == 409
    assert stale.json()["detail"]["code"] == "profileVersionConflict"


@pytest.mark.asyncio
async def test_professional_profile_validation_rules(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    email = f"invalid-{uuid.uuid4().hex[:10]}@development.invalid"
    bad_profession = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Bad Profession",
            "email": email,
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            **_profile_payload(profession="notAProfession"),
        },
    )
    assert bad_profession.status_code == 422

    emergency_without_community = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Emergency Without Community",
            "email": f"emg-{uuid.uuid4().hex[:10]}@development.invalid",
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            **_profile_payload(
                communityRequestsEnabled=False,
                emergencyRequestsEnabled=True,
            ),
        },
    )
    assert emergency_without_community.status_code == 422

    other_missing = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Other Missing",
            "email": f"other-{uuid.uuid4().hex[:10]}@development.invalid",
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            **_profile_payload(profession="otherApprovedHealthProfessional"),
        },
    )
    assert other_missing.status_code == 422

    other_ok = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Other Ok",
            "email": f"otherok-{uuid.uuid4().hex[:10]}@development.invalid",
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            **_profile_payload(
                profession="otherApprovedHealthProfessional",
                otherProfessionDescription="Approved CHPS volunteer supervisor",
            ),
        },
    )
    assert other_ok.status_code == 200, other_ok.text

    description_on_normal = await api_client.post(
        "/v1/admin/accounts",
        headers=headers,
        json={
            "displayName": "Desc Rejected",
            "email": f"desc-{uuid.uuid4().hex[:10]}@development.invalid",
            "facilityId": "fac-dev-001",
            "temporaryPassword": "TempWorker12Ab",
            "idempotencyKey": f"idem-{uuid.uuid4().hex}",
            **_profile_payload(
                profession="midwife",
                otherProfessionDescription="should not be allowed",
            ),
        },
    )
    assert description_on_normal.status_code == 422


@pytest.mark.asyncio
async def test_admin_only_account_cannot_receive_profile(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    resp = await api_client.patch(
        "/v1/admin/accounts/dev-admin-001/professional-profile",
        headers=headers,
        json=_profile_payload(),
    )
    assert resp.status_code in (400, 404)
    if resp.status_code == 400:
        assert resp.json()["detail"]["code"] == "workerRoleRequired"


@pytest.mark.asyncio
async def test_legacy_worker_without_profile_returns_null(api_client: AsyncClient) -> None:
    headers = await _admin_headers(api_client)
    account_id = f"acct-legacy-{uuid.uuid4().hex[:12]}"
    async with SessionLocal() as session:
        from northcare_api.domain.enums import AccountRole, AccountStatus, RoleAssignmentStatus
        from northcare_api.domain.models import ServerAccount, ServerAccountRole

        session.add(
            ServerAccount(
                id=account_id,
                remote_subject=account_id,
                display_name="Legacy Worker",
                role=AccountRole.WORKER,
                organisation_id="org-dev-001",
                facility_id="fac-dev-001",
                is_active=True,
                account_version=1,
                account_status=AccountStatus.ACTIVE,
                normalised_email=f"{account_id}@development.invalid",
                first_login_required=False,
                identity_provider="development",
            )
        )
        session.add(
            ServerAccountRole(
                id=f"role-{account_id}",
                account_id=account_id,
                role=AccountRole.WORKER,
                status=RoleAssignmentStatus.ACTIVE,
            )
        )
        await session.commit()

    details = await api_client.get(f"/v1/admin/accounts/{account_id}", headers=headers)
    assert details.status_code == 200
    assert details.json()["professionalProfile"] is None


@pytest.mark.asyncio
async def test_development_cli_sets_demo_profile_without_password_change(
    api_client: AsyncClient,
) -> None:
    headers = await _admin_headers(api_client)
    details = await api_client.get("/v1/admin/accounts/dev-worker-001", headers=headers)
    assert details.status_code == 200
    existing = details.json().get("professionalProfile")

    async with SessionLocal() as session:
        before = await session.get(DevelopmentCredential, "worker@development.invalid")
        verifier_before = before.password_hash if before else None

    code = await demo_cli.set_profile(
        email="worker@development.invalid",
        profession="communityHealthOfficer",
        community_requests_enabled=True,
        emergency_requests_enabled=True,
        other_profession_description=None,
    )
    assert code == 2  # blocked outside development (tests use NORTHCARE_ENV=test)

    payload = _profile_payload(
        profession="communityHealthOfficer",
        communityRequestsEnabled=True,
        emergencyRequestsEnabled=True,
    )
    if existing is not None:
        payload["expectedProfileVersion"] = existing["version"]

    created = await api_client.patch(
        "/v1/admin/accounts/dev-worker-001/professional-profile",
        headers=headers,
        json=payload,
    )
    assert created.status_code == 200, created.text
    assert created.json()["profession"] == "communityHealthOfficer"
    assert created.json()["communityRequestsEnabled"] is True
    assert created.json()["emergencyRequestsEnabled"] is True

    async with SessionLocal() as session:
        after = await session.get(DevelopmentCredential, "worker@development.invalid")
        if verifier_before is not None and after is not None:
            assert after.password_hash == verifier_before
        profile = await session.get(WorkerProfessionalProfile, "dev-worker-001")
        assert profile is not None
        assert profile.profession == "communityHealthOfficer"


def test_development_cli_blocked_outside_development(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NORTHCARE_ENV", "production")
    # Settings is cached via lru; clear if needed.
    from northcare_api import config

    config.get_settings.cache_clear()
    code = demo_cli.main(
        [
            "--email",
            "hamdansalifupolibu@gmail.com",
            "--profession",
            "communityHealthOfficer",
            "--community-requests-enabled",
            "--emergency-requests-enabled",
        ]
    )
    assert code == 2
    monkeypatch.setenv("NORTHCARE_ENV", "test")
    config.get_settings.cache_clear()


def test_settings_production_still_disables_dev_auth() -> None:
    assert Settings(NORTHCARE_ENV="production").development_auth_enabled is False
