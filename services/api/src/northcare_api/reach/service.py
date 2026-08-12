"""NorthCare Reach community-request service (create, route, status, worker lifecycle)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.administration.service import load_active_roles, write_audit
from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.config import Settings
from northcare_api.domain.enums import AccountStatus, has_worker_role
from northcare_api.domain.models import (
    CommunityRequest,
    ServerAccount,
    ServerFacility,
    WorkerProfessionalProfile,
)
from northcare_api.reach.enums import (
    PUBLIC_STATUS_LABELS,
    CommunityRequestCategory,
    CommunityRequestListFilter,
    CommunityRequestStatus,
)
from northcare_api.reach.errors import (
    REACH_ALREADY_ASSIGNED,
    REACH_DISABLED,
    REACH_EMERGENCY_CAPABILITY_REQUIRED,
    REACH_FACILITY_UNAVAILABLE,
    REACH_FORBIDDEN,
    REACH_NOT_FOUND,
    REACH_STATUS_LOOKUP_FAILED,
    REACH_STATUS_LOOKUP_LOCKED,
    REACH_VERSION_CONFLICT,
    REACH_WORKER_ROLE_REQUIRED,
    ReachError,
)
from northcare_api.reach.reference import (
    generate_reference_code,
    reference_collision_retry_limit,
)
from northcare_api.reach.routing import (
    RoutingCandidate,
    select_assignee,
    worker_matches_category,
)
from northcare_api.reach.schemas import (
    PublicCreateResponse,
    PublicStatusResponse,
    WorkerMutationResponse,
    WorkerRequestDetailResponse,
    WorkerRequestListItem,
    WorkerRequestListResponse,
)
from northcare_api.reach.status_pin import generate_status_pin, hash_status_pin, verify_status_pin
from northcare_api.reach.transitions import apply_transition
from northcare_api.reach.validation import validate_create_payload

logger = logging.getLogger("northcare_api.reach")

_SYSTEM_ACTOR = "reach-system"
_GENERIC_CREATE_MESSAGE = "Request received"
_SIMULATION_NOTICE = "Emergency coordination simulation"
_EMERGENCY_REMINDER = "If someone is in immediate danger, call 112 now."
_ESCALATE_MESSAGE = "Escalated for further human support."
_HANDLED_MESSAGE = (
    "Handled refers to the community request workflow, not clinical care completion."
)


def require_reach_enabled(settings: Settings) -> None:
    if not settings.reach_demo_enabled:
        raise REACH_DISABLED


class ReachService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self.session = session
        self.settings = settings

    async def create_public_request(self, raw_body: dict[str, object]) -> PublicCreateResponse:
        require_reach_enabled(self.settings)
        validated = validate_create_payload(raw_body)
        facility = await self._resolve_demo_facility()
        pin = generate_status_pin()
        pin_hash = hash_status_pin(pin)
        request_id = f"cr-{uuid.uuid4().hex}"
        routing = await self._route(
            category=str(validated["category"]),
            organisation_id=facility.organisation_id,
            facility_id=facility.id,
        )
        status = (
            CommunityRequestStatus.ASSIGNED
            if routing.assigned_worker_id
            else CommunityRequestStatus.RECEIVED
        )
        reference = await self._allocate_reference_code()
        now = datetime.now(UTC)
        row = CommunityRequest(
            id=request_id,
            reference_code=reference,
            status_pin_hash=pin_hash,
            channel=str(validated["channel"]),
            category=str(validated["category"]),
            request_type=str(validated["requestType"]),
            contact_number=str(validated["contactNumber"]),
            community_or_landmark=str(validated["communityOrLandmark"]),
            preferred_language=str(validated["preferredLanguage"]),
            consent_to_contact=True,
            consent_to_share_location=bool(validated["consentToShareLocation"]),
            organisation_id=facility.organisation_id,
            facility_id=facility.id,
            assigned_worker_id=routing.assigned_worker_id,
            status=status,
            version=1,
            failed_status_lookup_count=0,
            status_lookup_locked_until=None,
            created_at=now,
            updated_at=now,
        )
        self.session.add(row)
        await write_audit(
            self.session,
            organisation_id=facility.organisation_id,
            actor_account_id=_SYSTEM_ACTOR,
            target_account_id=routing.assigned_worker_id,
            event_type="community_request_created",
            result="success",
            safe_metadata={
                "requestId": request_id,
                "category": row.category,
                "requestType": row.request_type,
                "status": status,
                "facilityId": facility.id,
                "organisationId": facility.organisation_id,
                "assignedWorkerId": routing.assigned_worker_id,
                "version": 1,
            },
        )
        if routing.assigned_worker_id:
            await write_audit(
                self.session,
                organisation_id=facility.organisation_id,
                actor_account_id=_SYSTEM_ACTOR,
                target_account_id=routing.assigned_worker_id,
                event_type="community_request_assigned",
                result="success",
                safe_metadata={
                    "requestId": request_id,
                    "category": row.category,
                    "status": status,
                    "assignedWorkerId": routing.assigned_worker_id,
                    "facilityId": facility.id,
                    "organisationId": facility.organisation_id,
                    "version": 1,
                },
            )
        else:
            await write_audit(
                self.session,
                organisation_id=facility.organisation_id,
                actor_account_id=_SYSTEM_ACTOR,
                target_account_id=None,
                event_type="community_request_unassigned",
                result="success",
                safe_metadata={
                    "requestId": request_id,
                    "category": row.category,
                    "status": status,
                    "facilityId": facility.id,
                    "organisationId": facility.organisation_id,
                    "version": 1,
                },
            )
        await self.session.commit()
        logger.info(
            "reach_request_created request_id=%s category=%s status=%s",
            request_id,
            row.category,
            status,
        )
        is_emergency = row.category == CommunityRequestCategory.EMERGENCY
        return PublicCreateResponse(
            referenceCode=reference,
            statusPin=pin,
            publicMessage=_GENERIC_CREATE_MESSAGE,
            simulationNotice=_SIMULATION_NOTICE if is_emergency else None,
            emergencyReminder=_EMERGENCY_REMINDER,
        )

    async def public_status_lookup(
        self, *, reference_code: str, status_pin: str
    ) -> PublicStatusResponse:
        require_reach_enabled(self.settings)
        now = datetime.now(UTC)
        row = (
            await self.session.execute(
                select(CommunityRequest).where(CommunityRequest.reference_code == reference_code)
            )
        ).scalar_one_or_none()
        # Generic failure path — do not reveal whether reference exists.
        if row is None:
            raise REACH_STATUS_LOOKUP_FAILED
        if row.status_lookup_locked_until is not None and row.status_lookup_locked_until > now:
            await write_audit(
                self.session,
                organisation_id=row.organisation_id,
                actor_account_id=_SYSTEM_ACTOR,
                target_account_id=None,
                event_type="community_request_status_lookup_blocked",
                result="blocked",
                reason_category="lookup_lockout",
                safe_metadata={"requestId": row.id, "status": row.status},
            )
            await self.session.commit()
            raise REACH_STATUS_LOOKUP_LOCKED
        if not verify_status_pin(status_pin, row.status_pin_hash):
            row.failed_status_lookup_count += 1
            if row.failed_status_lookup_count >= self.settings.reach_status_lookup_max_failures:
                row.status_lookup_locked_until = now + timedelta(
                    seconds=self.settings.reach_status_lookup_lockout_seconds
                )
            row.updated_at = now
            await self.session.commit()
            raise REACH_STATUS_LOOKUP_FAILED
        row.failed_status_lookup_count = 0
        row.status_lookup_locked_until = None
        row.updated_at = now
        await self.session.commit()
        label = PUBLIC_STATUS_LABELS.get(row.status, "Request received")
        return PublicStatusResponse(publicStatusLabel=label)

    async def list_worker_requests(
        self,
        actor: AuthenticatedAccount,
        *,
        list_filter: CommunityRequestListFilter,
    ) -> WorkerRequestListResponse:
        require_reach_enabled(self.settings)
        profile = await self._require_worker_profile(actor)
        query = select(CommunityRequest).where(
            CommunityRequest.organisation_id == actor.organisation_id,
            CommunityRequest.facility_id == actor.facility_id,
        )
        if list_filter == CommunityRequestListFilter.ASSIGNED_TO_ME:
            query = query.where(CommunityRequest.assigned_worker_id == actor.account_id)
        elif list_filter == CommunityRequestListFilter.HANDLED:
            query = query.where(
                CommunityRequest.assigned_worker_id == actor.account_id,
                CommunityRequest.status == CommunityRequestStatus.HANDLED,
            )
        elif list_filter == CommunityRequestListFilter.EMERGENCY:
            if not profile.emergency_requests_enabled:
                return WorkerRequestListResponse(items=[])
            query = query.where(
                CommunityRequest.category == CommunityRequestCategory.EMERGENCY,
                or_(
                    CommunityRequest.assigned_worker_id == actor.account_id,
                    and_(
                        CommunityRequest.assigned_worker_id.is_(None),
                        CommunityRequest.status == CommunityRequestStatus.RECEIVED,
                    ),
                ),
            )
        else:  # awaiting
            query = query.where(
                or_(
                    CommunityRequest.assigned_worker_id == actor.account_id,
                    and_(
                        CommunityRequest.assigned_worker_id.is_(None),
                        CommunityRequest.status == CommunityRequestStatus.RECEIVED,
                    ),
                ),
                CommunityRequest.status.in_(
                    [
                        CommunityRequestStatus.RECEIVED,
                        CommunityRequestStatus.ASSIGNED,
                        CommunityRequestStatus.ACKNOWLEDGED,
                        CommunityRequestStatus.CONTACT_ATTEMPTED,
                        CommunityRequestStatus.ESCALATED,
                    ]
                ),
            )
        rows = (await self.session.execute(query.order_by(CommunityRequest.created_at.desc()))).scalars().all()
        items: list[WorkerRequestListItem] = []
        for row in rows:
            if row.assigned_worker_id != actor.account_id and not worker_matches_category(
                category=row.category,
                profession=profile.profession,
                community_requests_enabled=profile.community_requests_enabled,
                emergency_requests_enabled=profile.emergency_requests_enabled,
            ):
                continue
            items.append(
                WorkerRequestListItem(
                    requestId=row.id,
                    category=row.category,
                    requestType=row.request_type,
                    communityOrLandmark=row.community_or_landmark,
                    preferredLanguage=row.preferred_language,
                    status=row.status,
                    assignedToCaller=row.assigned_worker_id == actor.account_id,
                    createdAt=row.created_at.isoformat(),
                    updatedAt=row.updated_at.isoformat(),
                    version=row.version,
                )
            )
        return WorkerRequestListResponse(items=items)

    async def get_worker_request(
        self, actor: AuthenticatedAccount, request_id: str
    ) -> WorkerRequestDetailResponse:
        require_reach_enabled(self.settings)
        profile = await self._require_worker_profile(actor)
        row = await self._load_scoped_request(actor, request_id)
        await self._assert_worker_can_view(actor, profile, row)
        return WorkerRequestDetailResponse(
            requestId=row.id,
            category=row.category,
            requestType=row.request_type,
            contactNumber=row.contact_number,
            communityOrLandmark=row.community_or_landmark,
            preferredLanguage=row.preferred_language,
            consentToContact=row.consent_to_contact,
            consentToShareLocation=row.consent_to_share_location,
            status=row.status,
            assignedToCaller=row.assigned_worker_id == actor.account_id,
            assignedWorkerId=row.assigned_worker_id,
            createdAt=row.created_at.isoformat(),
            updatedAt=row.updated_at.isoformat(),
            version=row.version,
            handledMeans=_HANDLED_MESSAGE,
        )

    async def acknowledge(
        self, actor: AuthenticatedAccount, request_id: str, *, expected_version: int
    ) -> WorkerMutationResponse:
        require_reach_enabled(self.settings)
        profile = await self._require_worker_profile(actor)
        row = await self._lock_scoped_request(actor, request_id)
        if row.version != expected_version:
            raise REACH_VERSION_CONFLICT
        await self._assert_emergency_capability(profile, row)
        now = datetime.now(UTC)
        if row.assigned_worker_id == actor.account_id:
            apply_transition(row.status, CommunityRequestStatus.ACKNOWLEDGED)
            row.status = CommunityRequestStatus.ACKNOWLEDGED
        elif row.assigned_worker_id is None and row.status == CommunityRequestStatus.RECEIVED:
            if not worker_matches_category(
                category=row.category,
                profession=profile.profession,
                community_requests_enabled=profile.community_requests_enabled,
                emergency_requests_enabled=profile.emergency_requests_enabled,
            ):
                raise REACH_FORBIDDEN
            apply_transition(row.status, CommunityRequestStatus.ASSIGNED)
            row.assigned_worker_id = actor.account_id
            row.status = CommunityRequestStatus.ASSIGNED
            apply_transition(row.status, CommunityRequestStatus.ACKNOWLEDGED)
            row.status = CommunityRequestStatus.ACKNOWLEDGED
        elif row.assigned_worker_id is not None and row.assigned_worker_id != actor.account_id:
            raise REACH_ALREADY_ASSIGNED
        else:
            raise REACH_FORBIDDEN
        row.version += 1
        row.updated_at = now
        await write_audit(
            self.session,
            organisation_id=row.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=actor.account_id,
            event_type="community_request_acknowledged",
            result="success",
            safe_metadata={
                "requestId": row.id,
                "category": row.category,
                "status": row.status,
                "assignedWorkerId": row.assigned_worker_id,
                "facilityId": row.facility_id,
                "organisationId": row.organisation_id,
                "version": row.version,
            },
        )
        await self.session.commit()
        return WorkerMutationResponse(
            requestId=row.id,
            status=row.status,
            version=row.version,
            assignedWorkerId=row.assigned_worker_id,
        )

    async def contact_attempt(
        self, actor: AuthenticatedAccount, request_id: str, *, expected_version: int
    ) -> WorkerMutationResponse:
        return await self._mutate_assigned(
            actor,
            request_id,
            expected_version=expected_version,
            target_status=CommunityRequestStatus.CONTACT_ATTEMPTED,
            event_type="community_request_contact_attempted",
        )

    async def escalate(
        self, actor: AuthenticatedAccount, request_id: str, *, expected_version: int
    ) -> WorkerMutationResponse:
        require_reach_enabled(self.settings)
        profile = await self._require_worker_profile(actor)
        row = await self._lock_scoped_request(actor, request_id)
        if row.version != expected_version:
            raise REACH_VERSION_CONFLICT
        if row.assigned_worker_id != actor.account_id:
            raise REACH_FORBIDDEN
        await self._assert_emergency_capability(profile, row)
        apply_transition(row.status, CommunityRequestStatus.ESCALATED)
        row.status = CommunityRequestStatus.ESCALATED
        row.version += 1
        row.updated_at = datetime.now(UTC)
        await write_audit(
            self.session,
            organisation_id=row.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=actor.account_id,
            event_type="community_request_escalated",
            result="success",
            safe_metadata={
                "requestId": row.id,
                "category": row.category,
                "status": row.status,
                "assignedWorkerId": row.assigned_worker_id,
                "facilityId": row.facility_id,
                "organisationId": row.organisation_id,
                "version": row.version,
            },
        )
        await self.session.commit()
        return WorkerMutationResponse(
            requestId=row.id,
            status=row.status,
            version=row.version,
            assignedWorkerId=row.assigned_worker_id,
            message=_ESCALATE_MESSAGE,
        )

    async def handle(
        self, actor: AuthenticatedAccount, request_id: str, *, expected_version: int
    ) -> WorkerMutationResponse:
        result = await self._mutate_assigned(
            actor,
            request_id,
            expected_version=expected_version,
            target_status=CommunityRequestStatus.HANDLED,
            event_type="community_request_handled",
        )
        result.message = _HANDLED_MESSAGE
        return result

    async def _mutate_assigned(
        self,
        actor: AuthenticatedAccount,
        request_id: str,
        *,
        expected_version: int,
        target_status: str,
        event_type: str,
    ) -> WorkerMutationResponse:
        require_reach_enabled(self.settings)
        profile = await self._require_worker_profile(actor)
        row = await self._lock_scoped_request(actor, request_id)
        if row.version != expected_version:
            raise REACH_VERSION_CONFLICT
        if row.assigned_worker_id != actor.account_id:
            raise REACH_FORBIDDEN
        await self._assert_emergency_capability(profile, row)
        apply_transition(row.status, target_status)
        row.status = target_status
        row.version += 1
        row.updated_at = datetime.now(UTC)
        await write_audit(
            self.session,
            organisation_id=row.organisation_id,
            actor_account_id=actor.account_id,
            target_account_id=actor.account_id,
            event_type=event_type,
            result="success",
            safe_metadata={
                "requestId": row.id,
                "category": row.category,
                "status": row.status,
                "assignedWorkerId": row.assigned_worker_id,
                "facilityId": row.facility_id,
                "organisationId": row.organisation_id,
                "version": row.version,
            },
        )
        await self.session.commit()
        return WorkerMutationResponse(
            requestId=row.id,
            status=row.status,
            version=row.version,
            assignedWorkerId=row.assigned_worker_id,
        )

    async def _resolve_demo_facility(self) -> ServerFacility:
        facility = await self.session.get(ServerFacility, self.settings.reach_demo_facility_id)
        if (
            facility is None
            or not facility.is_active
            or facility.organisation_id != self.settings.reach_demo_organisation_id
        ):
            raise REACH_FACILITY_UNAVAILABLE
        return facility

    async def _allocate_reference_code(self) -> str:
        for _ in range(reference_collision_retry_limit()):
            candidate = generate_reference_code()
            existing = (
                await self.session.execute(
                    select(CommunityRequest.id).where(
                        CommunityRequest.reference_code == candidate
                    )
                )
            ).scalar_one_or_none()
            if existing is None:
                return candidate
        raise ReachError("referenceAllocationFailed", 500)

    async def _route(
        self, *, category: str, organisation_id: str, facility_id: str
    ) -> Any:
        rows = (
            await self.session.execute(
                select(ServerAccount, WorkerProfessionalProfile)
                .join(
                    WorkerProfessionalProfile,
                    WorkerProfessionalProfile.account_id == ServerAccount.id,
                )
                .where(
                    ServerAccount.organisation_id == organisation_id,
                    ServerAccount.facility_id == facility_id,
                    ServerAccount.is_active.is_(True),
                    ServerAccount.account_status != AccountStatus.INACTIVE,
                )
            )
        ).all()
        candidates: list[RoutingCandidate] = []
        for account, profile in rows:
            roles = await load_active_roles(self.session, account.id)
            if not has_worker_role(roles):
                continue
            candidates.append(
                RoutingCandidate(
                    account_id=account.id,
                    profession=profile.profession,
                    community_requests_enabled=profile.community_requests_enabled,
                    emergency_requests_enabled=profile.emergency_requests_enabled,
                )
            )
        return select_assignee(category=category, candidates=candidates)

    async def _require_worker_profile(
        self, actor: AuthenticatedAccount
    ) -> WorkerProfessionalProfile:
        if not has_worker_role(actor.roles):
            raise REACH_WORKER_ROLE_REQUIRED
        if not actor.is_active or actor.account_status == AccountStatus.INACTIVE:
            raise REACH_FORBIDDEN
        profile = await self.session.get(WorkerProfessionalProfile, actor.account_id)
        if profile is None or not profile.community_requests_enabled:
            raise REACH_FORBIDDEN
        return profile

    async def _load_scoped_request(
        self, actor: AuthenticatedAccount, request_id: str
    ) -> CommunityRequest:
        row = await self.session.get(CommunityRequest, request_id)
        if (
            row is None
            or row.organisation_id != actor.organisation_id
            or row.facility_id != actor.facility_id
        ):
            raise REACH_NOT_FOUND
        return row

    async def _lock_scoped_request(
        self, actor: AuthenticatedAccount, request_id: str
    ) -> CommunityRequest:
        row = (
            await self.session.execute(
                select(CommunityRequest)
                .where(CommunityRequest.id == request_id)
                .with_for_update()
            )
        ).scalar_one_or_none()
        if (
            row is None
            or row.organisation_id != actor.organisation_id
            or row.facility_id != actor.facility_id
        ):
            raise REACH_NOT_FOUND
        return row

    async def _assert_worker_can_view(
        self,
        actor: AuthenticatedAccount,
        profile: WorkerProfessionalProfile,
        row: CommunityRequest,
    ) -> None:
        if row.assigned_worker_id == actor.account_id:
            await self._assert_emergency_capability(profile, row)
            return
        if (
            row.assigned_worker_id is None
            and row.status == CommunityRequestStatus.RECEIVED
            and worker_matches_category(
                category=row.category,
                profession=profile.profession,
                community_requests_enabled=profile.community_requests_enabled,
                emergency_requests_enabled=profile.emergency_requests_enabled,
            )
        ):
            return
        raise REACH_FORBIDDEN

    async def _assert_emergency_capability(
        self, profile: WorkerProfessionalProfile, row: CommunityRequest
    ) -> None:
        if row.category == CommunityRequestCategory.EMERGENCY and not profile.emergency_requests_enabled:
            raise REACH_EMERGENCY_CAPABILITY_REQUIRED


async def safe_create_with_integrity(
    service: ReachService, raw_body: dict[str, object]
) -> PublicCreateResponse:
    """Wrapper used by tests to assert IntegrityError paths roll back cleanly."""
    try:
        return await service.create_public_request(raw_body)
    except IntegrityError:
        await service.session.rollback()
        raise
