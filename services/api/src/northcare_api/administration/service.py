from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.administration.email_normalisation import normalise_email
from northcare_api.administration.errors import (
    ACCOUNT_ALREADY_EXISTS,
    ACCOUNT_NOT_FOUND,
    ACCOUNT_VERSION_CONFLICT,
    DEVICE_ALREADY_REVOKED,
    DEVICE_NOT_FOUND,
    FACILITY_NOT_ASSIGNABLE,
    FACILITY_NOT_FOUND,
    FORBIDDEN,
    IDEMPOTENCY_KEY_REUSED,
    INVALID_ACCOUNT_TRANSITION,
    LAST_ADMINISTRATOR_PROTECTED,
    PROFILE_VERSION_CONFLICT,
    VALIDATION_FAILED,
    WORKER_ROLE_REQUIRED,
)
from northcare_api.administration.identity_provisioning import (
    IdentityProvisioningProvider,
    build_identity_provisioning_provider,
)
from northcare_api.administration.policies import require_admin, require_fresh_admin_token
from northcare_api.administration.professional_profile import (
    ValidatedProfessionalProfileInput,
    validate_professional_profile_input,
)
from northcare_api.administration.professions import list_active_professions
from northcare_api.administration.schemas import (
    AdminAccountDetails,
    AdminAccountListResponse,
    AdminAccountSummary,
    AdminDeviceItem,
    AdminDeviceListResponse,
    AdminFacilityItem,
    AdminFacilityListResponse,
    AdminHistoryItem,
    AdminHistoryResponse,
    AdminHomeSummaryResponse,
    MutationAckResponse,
    ProfessionalProfileResponse,
    ProfessionalProfileUpsertRequest,
    ProfessionItem,
    ProfessionRegistryResponse,
    RegisterWorkerRequest,
    RegisterWorkerResponse,
    SessionAuthorisationResponse,
)
from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.config import Settings
from northcare_api.domain.enums import (
    AccountRole,
    AccountStatus,
    DeviceStatus,
    RoleAssignmentStatus,
    has_admin_role,
    permitted_workspaces,
    primary_role,
)
from northcare_api.domain.models import (
    AdminIdempotencyKey,
    AdministrationAuditEvent,
    RegisteredDevice,
    ServerAccount,
    ServerAccountRole,
    ServerFacility,
    WorkerProfessionalProfile,
)
from northcare_api.security.hashing import request_hash


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value is not None else None


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:20]}"


async def load_active_roles(session: AsyncSession, account_id: str) -> list[str]:
    rows = (
        await session.execute(
            select(ServerAccountRole.role).where(
                ServerAccountRole.account_id == account_id,
                ServerAccountRole.status == RoleAssignmentStatus.ACTIVE,
            )
        )
    ).scalars().all()
    return list(rows)


async def ensure_role_assignment(
    session: AsyncSession,
    *,
    account_id: str,
    role: str,
    assigned_by: str | None,
) -> None:
    existing = (
        await session.execute(
            select(ServerAccountRole).where(
                ServerAccountRole.account_id == account_id,
                ServerAccountRole.role == role,
            )
        )
    ).scalar_one_or_none()
    now = _utcnow()
    if existing is None:
        session.add(
            ServerAccountRole(
                id=_new_id("role"),
                account_id=account_id,
                role=role,
                status=RoleAssignmentStatus.ACTIVE,
                assigned_at=now,
                assigned_by_account_id=assigned_by,
            )
        )
        return
    if existing.status != RoleAssignmentStatus.ACTIVE:
        existing.status = RoleAssignmentStatus.ACTIVE
        existing.revoked_at = None
        existing.assigned_at = now
        existing.assigned_by_account_id = assigned_by
        existing.updated_at = now


async def write_audit(
    session: AsyncSession,
    *,
    organisation_id: str,
    actor_account_id: str,
    target_account_id: str | None,
    event_type: str,
    result: str = "success",
    reason_category: str | None = None,
    safe_metadata: dict[str, Any] | None = None,
) -> None:
    session.add(
        AdministrationAuditEvent(
            id=_new_id("aud"),
            organisation_id=organisation_id,
            actor_account_id=actor_account_id,
            target_account_id=target_account_id,
            event_type=event_type,
            result=result,
            reason_category=reason_category,
            safe_metadata=safe_metadata or {},
        )
    )


async def count_active_admins(session: AsyncSession, organisation_id: str) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(ServerAccountRole)
        .join(ServerAccount, ServerAccount.id == ServerAccountRole.account_id)
        .where(
            ServerAccount.organisation_id == organisation_id,
            ServerAccount.is_active.is_(True),
            ServerAccount.account_status != AccountStatus.INACTIVE,
            ServerAccountRole.role == AccountRole.ADMIN,
            ServerAccountRole.status == RoleAssignmentStatus.ACTIVE,
        )
    )
    return int(result.scalar_one())


class AdministrationService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings,
        provider: IdentityProvisioningProvider | None = None,
    ) -> None:
        self.session = session
        self.settings = settings
        self.provider = provider or build_identity_provisioning_provider(settings)

    async def session_authorisation(
        self, account: AuthenticatedAccount
    ) -> SessionAuthorisationResponse:
        roles = await load_active_roles(self.session, account.account_id)
        worker_facility = account.facility_id if "worker" in roles else None
        return SessionAuthorisationResponse(
            accountId=account.account_id,
            displayName=account.display_name,
            email=account.normalised_email,
            roles=roles,
            permittedWorkspaces=permitted_workspaces(roles),
            accountStatus=account.account_status,
            organisationId=account.organisation_id,
            workerFacilityId=worker_facility,
            firstLoginRequired=account.first_login_required,
            accountVersion=account.account_version,
            identityProvider=account.identity_provider,
        )

    async def home_summary(self, actor: AuthenticatedAccount) -> AdminHomeSummaryResponse:
        require_admin(actor)
        org = actor.organisation_id
        worker_count = int(
            (
                await self.session.execute(
                    select(func.count())
                    .select_from(ServerAccountRole)
                    .join(ServerAccount, ServerAccount.id == ServerAccountRole.account_id)
                    .where(
                        ServerAccount.organisation_id == org,
                        ServerAccountRole.role == AccountRole.WORKER,
                        ServerAccountRole.status == RoleAssignmentStatus.ACTIVE,
                    )
                )
            ).scalar_one()
        )
        pending = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(ServerAccount).where(
                        ServerAccount.organisation_id == org,
                        ServerAccount.account_status == AccountStatus.PENDING_FIRST_LOGIN,
                    )
                )
            ).scalar_one()
        )
        inactive = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(ServerAccount).where(
                        ServerAccount.organisation_id == org,
                        ServerAccount.account_status == AccountStatus.INACTIVE,
                    )
                )
            ).scalar_one()
        )
        return AdminHomeSummaryResponse(
            organisationId=org,
            workerCount=worker_count,
            pendingFirstLoginCount=pending,
            inactiveWorkerCount=inactive,
            backendAvailable=True,
        )

    async def list_facilities(self, actor: AuthenticatedAccount) -> AdminFacilityListResponse:
        require_admin(actor)
        rows = (
            await self.session.execute(
                select(ServerFacility)
                .where(
                    ServerFacility.organisation_id == actor.organisation_id,
                    ServerFacility.is_active.is_(True),
                )
                .order_by(ServerFacility.name)
            )
        ).scalars().all()
        return AdminFacilityListResponse(
            items=[
                AdminFacilityItem(
                    facilityId=row.id,
                    name=row.name,
                    facilityType=row.facility_type,
                    district=row.district,
                    region=row.region,
                    isActive=row.is_active,
                )
                for row in rows
            ]
        )

    async def list_accounts(
        self,
        actor: AuthenticatedAccount,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        facility_id: str | None = None,
        status: str | None = None,
    ) -> AdminAccountListResponse:
        require_admin(actor)
        page = max(page, 1)
        page_size = min(max(page_size, 1), 50)
        filters = [
            ServerAccount.organisation_id == actor.organisation_id,
        ]
        # Ordinary Stage 16 list focuses on worker-bearing accounts.
        worker_account_ids = (
            await self.session.execute(
                select(ServerAccountRole.account_id).where(
                    ServerAccountRole.role == AccountRole.WORKER,
                    ServerAccountRole.status == RoleAssignmentStatus.ACTIVE,
                )
            )
        ).scalars().all()
        filters.append(ServerAccount.id.in_(list(worker_account_ids) or ["__none__"]))
        if facility_id:
            filters.append(ServerAccount.facility_id == facility_id)
        if status:
            filters.append(ServerAccount.account_status == status)
        if search:
            term = f"%{search.strip().lower()}%"
            filters.append(
                or_(
                    func.lower(ServerAccount.display_name).like(term),
                    func.lower(func.coalesce(ServerAccount.normalised_email, "")).like(term),
                    func.lower(ServerAccount.facility_id).like(term),
                )
            )
        total = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(ServerAccount).where(and_(*filters))
                )
            ).scalar_one()
        )
        rows = (
            await self.session.execute(
                select(ServerAccount)
                .where(and_(*filters))
                .order_by(ServerAccount.display_name)
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).scalars().all()
        items = [await self._to_summary(row) for row in rows]
        return AdminAccountListResponse(
            items=items,
            page=page,
            pageSize=page_size,
            total=total,
            organisationId=actor.organisation_id,
        )

    async def get_account(
        self, actor: AuthenticatedAccount, account_id: str
    ) -> AdminAccountDetails:
        require_admin(actor)
        account = await self._get_org_account(actor, account_id)
        summary = await self._to_summary(account)
        roles = await load_active_roles(self.session, account.id)
        profile = await self._get_profile_response(account.id)
        return AdminAccountDetails(
            **summary.model_dump(by_alias=True),
            organisationId=account.organisation_id,
            organisationName="NorthCare Demo Organisation",
            identityProvider=account.identity_provider,
            createdAt=account.created_at.isoformat(),
            permittedWorkspaces=permitted_workspaces(roles),
            professionalProfile=profile,
        )

    async def list_professions(
        self, actor: AuthenticatedAccount
    ) -> ProfessionRegistryResponse:
        require_admin(actor)
        return ProfessionRegistryResponse(
            items=[
                ProfessionItem(
                    value=item.value,
                    label=item.label,
                    active=item.active,
                    allowsOtherDescription=item.allows_other_description,
                    displayOrder=item.display_order,
                )
                for item in list_active_professions()
            ]
        )

    async def register_worker(
        self,
        actor: AuthenticatedAccount,
        body: RegisterWorkerRequest,
        *,
        token_issued_at: int | None,
    ) -> RegisterWorkerResponse:
        require_fresh_admin_token(actor, token_issued_at)
        try:
            email = normalise_email(body.email)
        except ValueError as exc:
            raise VALIDATION_FAILED from exc
        display_name = body.display_name.strip()
        if len(display_name) < 2:
            raise VALIDATION_FAILED

        profile_input = validate_professional_profile_input(
            profession=body.profession,
            other_profession_description=body.other_profession_description,
            community_requests_enabled=body.community_requests_enabled,
            emergency_requests_enabled=body.emergency_requests_enabled,
        )

        content_hash = request_hash(
            {
                "displayName": display_name,
                "email": email,
                "facilityId": body.facility_id,
                "profession": profile_input.profession,
                "otherProfessionDescription": profile_input.other_profession_description,
                "communityRequestsEnabled": profile_input.community_requests_enabled,
                "emergencyRequestsEnabled": profile_input.emergency_requests_enabled,
            }
        )
        existing_key = await self.session.get(AdminIdempotencyKey, body.idempotency_key)
        if existing_key is not None:
            if (
                existing_key.actor_account_id != actor.account_id
                or existing_key.operation != "registerWorker"
                or existing_key.request_hash != content_hash
            ):
                raise IDEMPOTENCY_KEY_REUSED
            return RegisterWorkerResponse.model_validate(existing_key.response_json)

        duplicate = (
            await self.session.execute(
                select(ServerAccount).where(ServerAccount.normalised_email == email)
            )
        ).scalar_one_or_none()
        if duplicate is not None:
            if duplicate.organisation_id != actor.organisation_id:
                raise ACCOUNT_ALREADY_EXISTS
            raise ACCOUNT_ALREADY_EXISTS

        facility = await self.session.get(ServerFacility, body.facility_id)
        if facility is None:
            raise FACILITY_NOT_FOUND
        if (
            not facility.is_active
            or facility.organisation_id != actor.organisation_id
        ):
            raise FACILITY_NOT_ASSIGNABLE

        account_id = _new_id("acct")
        account = ServerAccount(
            id=account_id,
            remote_subject=account_id,
            display_name=display_name,
            role=AccountRole.WORKER,
            organisation_id=actor.organisation_id,
            facility_id=facility.id,
            is_active=True,
            account_version=1,
            account_status=AccountStatus.PENDING_PROVISIONING,
            normalised_email=email,
            first_login_required=True,
            identity_provider=self.provider.provider_id,
        )
        self.session.add(account)
        await self.session.flush()

        try:
            identity = await self.provider.create_worker_identity(
                self.session,
                account_id=account_id,
                email=email,
                temporary_password=body.temporary_password,
            )
        except Exception:
            account.account_status = AccountStatus.PROVISIONING_FAILED
            await write_audit(
                self.session,
                organisation_id=actor.organisation_id,
                actor_account_id=actor.account_id,
                target_account_id=account_id,
                event_type="identityProvisioningFailed",
                result="failure",
                reason_category="provider",
            )
            await self.session.commit()
            raise

        account.remote_subject = identity.remote_subject
        account.identity_provider = identity.provider
        account.account_status = AccountStatus.PENDING_FIRST_LOGIN
        account.first_login_required = True
        await ensure_role_assignment(
            self.session,
            account_id=account_id,
            role=AccountRole.WORKER,
            assigned_by=actor.account_id,
        )
        profile = await self._create_profile(
            account_id=account_id,
            profile_input=profile_input,
            actor=actor,
            created_via="registration",
        )
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account_id,
            event_type="accountProvisioned",
            safe_metadata={"facilityId": facility.id},
        )
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account_id,
            event_type="workerRoleAssigned",
        )
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account_id,
            event_type="workerFacilityAssigned",
            safe_metadata={"facilityId": facility.id},
        )
        response = RegisterWorkerResponse(
            accountId=account_id,
            displayName=display_name,
            email=email,
            roles=[AccountRole.WORKER],
            facilityId=facility.id,
            accountStatus=account.account_status,
            firstLoginRequired=True,
            accountVersion=account.account_version,
            identityProvider=account.identity_provider,
            professionalProfile=self._to_profile_response(profile),
        )
        self.session.add(
            AdminIdempotencyKey(
                idempotency_key=body.idempotency_key,
                actor_account_id=actor.account_id,
                operation="registerWorker",
                request_hash=content_hash,
                response_json=response.model_dump(by_alias=True),
            )
        )
        await self.session.commit()
        return response

    async def upsert_professional_profile(
        self,
        actor: AuthenticatedAccount,
        account_id: str,
        body: ProfessionalProfileUpsertRequest,
        *,
        token_issued_at: int | None,
    ) -> ProfessionalProfileResponse:
        require_fresh_admin_token(actor, token_issued_at)
        account = await self._get_org_account(actor, account_id)
        roles = await load_active_roles(self.session, account.id)
        if AccountRole.WORKER not in roles:
            raise WORKER_ROLE_REQUIRED

        profile_input = validate_professional_profile_input(
            profession=body.profession,
            other_profession_description=body.other_profession_description,
            community_requests_enabled=body.community_requests_enabled,
            emergency_requests_enabled=body.emergency_requests_enabled,
        )
        existing = await self.session.get(WorkerProfessionalProfile, account.id)
        if existing is None:
            if body.expected_profile_version is not None:
                raise PROFILE_VERSION_CONFLICT
            profile = await self._create_profile(
                account_id=account.id,
                profile_input=profile_input,
                actor=actor,
                created_via="adminUpdate",
            )
            await self.session.commit()
            return self._to_profile_response(profile)

        if (
            body.expected_profile_version is None
            or existing.version != body.expected_profile_version
        ):
            await write_audit(
                self.session,
                organisation_id=actor.organisation_id,
                actor_account_id=actor.account_id,
                target_account_id=account.id,
                event_type="professionalProfileStaleUpdateRejected",
                result="failure",
                reason_category="versionConflict",
                safe_metadata={"expectedProfileVersion": body.expected_profile_version},
            )
            await self.session.commit()
            raise PROFILE_VERSION_CONFLICT

        previous_community = existing.community_requests_enabled
        previous_emergency = existing.emergency_requests_enabled
        existing.profession = profile_input.profession
        existing.other_profession_description = profile_input.other_profession_description
        existing.community_requests_enabled = profile_input.community_requests_enabled
        existing.emergency_requests_enabled = profile_input.emergency_requests_enabled
        existing.version += 1
        existing.updated_at = _utcnow()
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account.id,
            event_type="professionalProfileUpdated",
            safe_metadata={
                "profession": existing.profession,
                "communityRequestsEnabled": existing.community_requests_enabled,
                "emergencyRequestsEnabled": existing.emergency_requests_enabled,
                "profileVersion": existing.version,
            },
        )
        if previous_community != existing.community_requests_enabled:
            await write_audit(
                self.session,
                organisation_id=actor.organisation_id,
                actor_account_id=actor.account_id,
                target_account_id=account.id,
                event_type=(
                    "communityRequestCapabilityEnabled"
                    if existing.community_requests_enabled
                    else "communityRequestCapabilityDisabled"
                ),
                safe_metadata={"communityRequestsEnabled": existing.community_requests_enabled},
            )
        if previous_emergency != existing.emergency_requests_enabled:
            await write_audit(
                self.session,
                organisation_id=actor.organisation_id,
                actor_account_id=actor.account_id,
                target_account_id=account.id,
                event_type=(
                    "emergencyRequestCapabilityEnabled"
                    if existing.emergency_requests_enabled
                    else "emergencyRequestCapabilityDisabled"
                ),
                safe_metadata={"emergencyRequestsEnabled": existing.emergency_requests_enabled},
            )
        await self.session.commit()
        return self._to_profile_response(existing)

    async def change_facility(
        self,
        actor: AuthenticatedAccount,
        account_id: str,
        *,
        facility_id: str,
        expected_version: int,
        token_issued_at: int | None,
    ) -> MutationAckResponse:
        require_fresh_admin_token(actor, token_issued_at)
        account = await self._get_org_account(actor, account_id)
        roles = await load_active_roles(self.session, account.id)
        if AccountRole.WORKER not in roles:
            raise FORBIDDEN
        if has_admin_role(roles) and AccountRole.WORKER in roles:
            # Dual-role accounts may still reassign worker facility with confirmation.
            pass
        if account.account_version != expected_version:
            raise ACCOUNT_VERSION_CONFLICT
        facility = await self.session.get(ServerFacility, facility_id)
        if facility is None:
            raise FACILITY_NOT_FOUND
        if not facility.is_active or facility.organisation_id != actor.organisation_id:
            raise FACILITY_NOT_ASSIGNABLE
        previous = account.facility_id
        account.facility_id = facility.id
        account.account_version += 1
        account.updated_at = _utcnow()
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account.id,
            event_type="facilityChanged",
            safe_metadata={"fromFacilityId": previous, "toFacilityId": facility.id},
        )
        await self.session.commit()
        return MutationAckResponse(
            accountId=account.id,
            accountStatus=account.account_status,
            accountVersion=account.account_version,
            facilityId=account.facility_id,
        )

    async def deactivate(
        self,
        actor: AuthenticatedAccount,
        account_id: str,
        *,
        expected_version: int,
        token_issued_at: int | None,
    ) -> MutationAckResponse:
        require_fresh_admin_token(actor, token_issued_at)
        account = await self._get_org_account(actor, account_id)
        if account.account_version != expected_version:
            raise ACCOUNT_VERSION_CONFLICT
        roles = await load_active_roles(self.session, account.id)
        if has_admin_role(roles):
            # Ordinary worker-management UI must not deactivate admin-bearing accounts.
            raise LAST_ADMINISTRATOR_PROTECTED
        if account.account_status == AccountStatus.INACTIVE:
            raise INVALID_ACCOUNT_TRANSITION
        if AccountRole.WORKER not in roles:
            raise FORBIDDEN
        account.is_active = False
        account.account_status = AccountStatus.INACTIVE
        account.account_version += 1
        await self.provider.disable_identity(self.session, account)
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account.id,
            event_type="accountDeactivated",
        )
        await self.session.commit()
        return MutationAckResponse(
            accountId=account.id,
            accountStatus=account.account_status,
            accountVersion=account.account_version,
            facilityId=account.facility_id,
        )

    async def reactivate(
        self,
        actor: AuthenticatedAccount,
        account_id: str,
        *,
        expected_version: int,
        token_issued_at: int | None,
    ) -> MutationAckResponse:
        require_fresh_admin_token(actor, token_issued_at)
        account = await self._get_org_account(actor, account_id)
        if account.account_version != expected_version:
            raise ACCOUNT_VERSION_CONFLICT
        if account.account_status != AccountStatus.INACTIVE:
            raise INVALID_ACCOUNT_TRANSITION
        facility = await self.session.get(ServerFacility, account.facility_id)
        if facility is None or not facility.is_active:
            raise FACILITY_NOT_ASSIGNABLE
        account.is_active = True
        account.account_status = AccountStatus.ACTIVE
        account.account_version += 1
        await self.provider.enable_identity(self.session, account)
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account.id,
            event_type="accountActivated",
        )
        await self.session.commit()
        return MutationAckResponse(
            accountId=account.id,
            accountStatus=account.account_status,
            accountVersion=account.account_version,
            facilityId=account.facility_id,
        )

    async def reset_access(
        self,
        actor: AuthenticatedAccount,
        account_id: str,
        *,
        expected_version: int,
        temporary_password: str,
        token_issued_at: int | None,
    ) -> MutationAckResponse:
        require_fresh_admin_token(actor, token_issued_at)
        account = await self._get_org_account(actor, account_id)
        if account.account_version != expected_version:
            raise ACCOUNT_VERSION_CONFLICT
        roles = await load_active_roles(self.session, account.id)
        if has_admin_role(roles) and AccountRole.WORKER not in roles:
            raise FORBIDDEN
        await self.provider.initiate_password_reset(
            self.session, account, temporary_password=temporary_password
        )
        account.first_login_required = True
        account.account_status = AccountStatus.PENDING_FIRST_LOGIN
        account.account_version += 1
        # Soft-revoke active devices for the account.
        devices = (
            await self.session.execute(
                select(RegisteredDevice).where(
                    RegisteredDevice.account_id == account.id,
                    RegisteredDevice.status == DeviceStatus.ACTIVE,
                )
            )
        ).scalars().all()
        now = _utcnow()
        for device in devices:
            device.status = DeviceStatus.REVOKED
            device.revoked_at = now
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account.id,
            event_type="passwordResetInitiated",
        )
        await self.session.commit()
        return MutationAckResponse(
            accountId=account.id,
            accountStatus=account.account_status,
            accountVersion=account.account_version,
            facilityId=account.facility_id,
        )

    async def list_devices(
        self, actor: AuthenticatedAccount, account_id: str, *, current_device_id: str | None
    ) -> AdminDeviceListResponse:
        require_admin(actor)
        account = await self._get_org_account(actor, account_id)
        rows = (
            await self.session.execute(
                select(RegisteredDevice)
                .where(RegisteredDevice.account_id == account.id)
                .order_by(RegisteredDevice.last_seen_at.desc())
            )
        ).scalars().all()
        return AdminDeviceListResponse(
            items=[
                AdminDeviceItem(
                    deviceId=row.id,
                    label=row.label or f"Installation {row.id[-6:]}",
                    platform=row.platform,
                    appVersion=row.app_version,
                    status=row.status,
                    createdAt=row.created_at.isoformat(),
                    lastSeenAt=row.last_seen_at.isoformat(),
                    isCurrent=current_device_id == row.id,
                )
                for row in rows
            ]
        )

    async def revoke_device(
        self,
        actor: AuthenticatedAccount,
        account_id: str,
        device_id: str,
        *,
        token_issued_at: int | None,
    ) -> AdminDeviceItem:
        require_fresh_admin_token(actor, token_issued_at)
        account = await self._get_org_account(actor, account_id)
        device = await self.session.get(RegisteredDevice, device_id)
        if device is None or device.account_id != account.id:
            raise DEVICE_NOT_FOUND
        if device.status == DeviceStatus.REVOKED:
            raise DEVICE_ALREADY_REVOKED
        device.status = DeviceStatus.REVOKED
        device.revoked_at = _utcnow()
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account.id,
            event_type="deviceRevoked",
            safe_metadata={"deviceId": device.id},
        )
        await self.session.commit()
        return AdminDeviceItem(
            deviceId=device.id,
            label=device.label or f"Installation {device.id[-6:]}",
            platform=device.platform,
            appVersion=device.app_version,
            status=device.status,
            createdAt=device.created_at.isoformat(),
            lastSeenAt=device.last_seen_at.isoformat(),
            isCurrent=False,
        )

    async def history(
        self, actor: AuthenticatedAccount, account_id: str
    ) -> AdminHistoryResponse:
        require_admin(actor)
        account = await self._get_org_account(actor, account_id)
        rows = (
            await self.session.execute(
                select(AdministrationAuditEvent)
                .where(
                    AdministrationAuditEvent.organisation_id == actor.organisation_id,
                    AdministrationAuditEvent.target_account_id == account.id,
                )
                .order_by(AdministrationAuditEvent.created_at.desc())
                .limit(100)
            )
        ).scalars().all()
        return AdminHistoryResponse(
            items=[
                AdminHistoryItem(
                    eventId=row.id,
                    eventType=row.event_type,
                    createdAt=row.created_at.isoformat(),
                    actorAccountId=row.actor_account_id,
                    targetAccountId=row.target_account_id,
                    result=row.result,
                    reasonCategory=row.reason_category,
                )
                for row in rows
            ]
        )

    async def change_password(
        self,
        account: AuthenticatedAccount,
        *,
        current_password: str,
        new_password: str,
    ) -> dict[str, Any]:
        row = await self.session.get(ServerAccount, account.account_id)
        if row is None:
            raise ACCOUNT_NOT_FOUND
        await self.provider.change_password(
            self.session,
            row,
            current_password=current_password,
            new_password=new_password,
        )
        row.first_login_required = False
        if row.account_status == AccountStatus.PENDING_FIRST_LOGIN:
            row.account_status = AccountStatus.ACTIVE
        row.account_version += 1
        await write_audit(
            self.session,
            organisation_id=row.organisation_id,
            actor_account_id=row.id,
            target_account_id=row.id,
            event_type="firstLoginPasswordChanged",
        )
        await self.session.commit()
        return {
            "accountId": row.id,
            "accountStatus": row.account_status,
            "firstLoginRequired": row.first_login_required,
        }

    async def _get_org_account(
        self, actor: AuthenticatedAccount, account_id: str
    ) -> ServerAccount:
        account = await self.session.get(ServerAccount, account_id)
        if account is None or account.organisation_id != actor.organisation_id:
            raise ACCOUNT_NOT_FOUND
        return account

    def _to_profile_response(
        self, profile: WorkerProfessionalProfile
    ) -> ProfessionalProfileResponse:
        return ProfessionalProfileResponse(
            accountId=profile.account_id,
            profession=profile.profession,
            otherProfessionDescription=profile.other_profession_description,
            communityRequestsEnabled=profile.community_requests_enabled,
            emergencyRequestsEnabled=profile.emergency_requests_enabled,
            version=profile.version,
            createdAt=profile.created_at.isoformat()
            if profile.created_at is not None
            else _utcnow().isoformat(),
            updatedAt=profile.updated_at.isoformat()
            if profile.updated_at is not None
            else _utcnow().isoformat(),
        )

    async def _get_profile_response(
        self, account_id: str
    ) -> ProfessionalProfileResponse | None:
        profile = await self.session.get(WorkerProfessionalProfile, account_id)
        if profile is None:
            return None
        return self._to_profile_response(profile)

    async def _create_profile(
        self,
        *,
        account_id: str,
        profile_input: ValidatedProfessionalProfileInput,
        actor: AuthenticatedAccount,
        created_via: str,
    ) -> WorkerProfessionalProfile:
        now = _utcnow()
        profile = WorkerProfessionalProfile(
            account_id=account_id,
            profession=profile_input.profession,
            other_profession_description=profile_input.other_profession_description,
            community_requests_enabled=profile_input.community_requests_enabled,
            emergency_requests_enabled=profile_input.emergency_requests_enabled,
            version=1,
            created_at=now,
            updated_at=now,
        )
        self.session.add(profile)
        await self.session.flush()
        await write_audit(
            self.session,
            organisation_id=actor.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=account_id,
            event_type="professionalProfileCreated",
            safe_metadata={
                "profession": profile.profession,
                "communityRequestsEnabled": profile.community_requests_enabled,
                "emergencyRequestsEnabled": profile.emergency_requests_enabled,
                "createdVia": created_via,
                "profileVersion": profile.version,
            },
        )
        if profile.community_requests_enabled:
            await write_audit(
                self.session,
                organisation_id=actor.organisation_id,
                actor_account_id=actor.account_id,
                target_account_id=account_id,
                event_type="communityRequestCapabilityEnabled",
                safe_metadata={"communityRequestsEnabled": True},
            )
        if profile.emergency_requests_enabled:
            await write_audit(
                self.session,
                organisation_id=actor.organisation_id,
                actor_account_id=actor.account_id,
                target_account_id=account_id,
                event_type="emergencyRequestCapabilityEnabled",
                safe_metadata={"emergencyRequestsEnabled": True},
            )
        return profile

    async def _to_summary(self, account: ServerAccount) -> AdminAccountSummary:
        roles = await load_active_roles(self.session, account.id)
        facility = await self.session.get(ServerFacility, account.facility_id)
        device_count = int(
            (
                await self.session.execute(
                    select(func.count()).select_from(RegisteredDevice).where(
                        RegisteredDevice.account_id == account.id,
                        RegisteredDevice.status == DeviceStatus.ACTIVE,
                    )
                )
            ).scalar_one()
        )
        return AdminAccountSummary(
            accountId=account.id,
            displayName=account.display_name,
            email=account.normalised_email,
            roles=roles or [primary_role(roles)],
            facilityId=account.facility_id,
            facilityName=facility.name if facility else account.facility_id,
            accountStatus=account.account_status,
            firstLoginRequired=account.first_login_required,
            lastRemoteSignInAt=_iso(account.last_remote_sign_in_at),
            registeredDeviceCount=device_count,
            accountVersion=account.account_version,
            updatedAt=account.updated_at.isoformat(),
        )
