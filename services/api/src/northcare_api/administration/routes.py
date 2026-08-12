from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from northcare_api.administration.errors import AdministrationError
from northcare_api.administration.schemas import (
    AccountVersionMutationRequest,
    AdminAccountDetails,
    AdminAccountListResponse,
    AdminDeviceItem,
    AdminDeviceListResponse,
    AdminFacilityListResponse,
    AdminHistoryResponse,
    AdminHomeSummaryResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    FacilityChangeRequest,
    MutationAckResponse,
    ProfessionalProfileResponse,
    ProfessionalProfileUpsertRequest,
    ProfessionRegistryResponse,
    RegisterWorkerRequest,
    RegisterWorkerResponse,
    ResetAccessRequest,
    SessionAuthorisationResponse,
)
from northcare_api.administration.service import AdministrationService
from northcare_api.auth.deps import AuthContext, get_auth_context, get_current_account
from northcare_api.auth.identity import AuthenticatedAccount
from northcare_api.config import Settings, get_settings
from northcare_api.database import get_session

router = APIRouter(prefix="/v1/admin", tags=["administration"])
auth_router = APIRouter(prefix="/v1/auth", tags=["auth"])


def _http_error(error: AdministrationError) -> HTTPException:
    return HTTPException(status_code=error.http_status, detail={"code": error.code})


def _service(
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> AdministrationService:
    return AdministrationService(session, settings)


@auth_router.get("/session", response_model=SessionAuthorisationResponse)
async def get_session_authorisation(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
) -> SessionAuthorisationResponse:
    return await service.session_authorisation(account)


@auth_router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    body: ChangePasswordRequest,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
) -> ChangePasswordResponse:
    try:
        result = await service.change_password(
            account,
            current_password=body.current_password,
            new_password=body.new_password,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc
    return ChangePasswordResponse.model_validate(result)


@router.get("/home", response_model=AdminHomeSummaryResponse)
async def admin_home(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
) -> AdminHomeSummaryResponse:
    try:
        return await service.home_summary(account)
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.get("/facilities", response_model=AdminFacilityListResponse)
async def list_facilities(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
) -> AdminFacilityListResponse:
    try:
        return await service.list_facilities(account)
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.get("/professions", response_model=ProfessionRegistryResponse)
async def list_professions(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
) -> ProfessionRegistryResponse:
    try:
        return await service.list_professions(account)
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.get("/accounts", response_model=AdminAccountListResponse)
async def list_accounts(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=50)] = 20,
    search: str | None = None,
    facility_id: Annotated[str | None, Query(alias="facilityId")] = None,
    status: str | None = None,
) -> AdminAccountListResponse:
    try:
        return await service.list_accounts(
            account,
            page=page,
            page_size=page_size,
            search=search,
            facility_id=facility_id,
            status=status,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.post("/accounts", response_model=RegisterWorkerResponse)
async def register_worker(
    body: RegisterWorkerRequest,
    auth: AuthContext = Depends(get_auth_context),
    service: AdministrationService = Depends(_service),
) -> RegisterWorkerResponse:
    try:
        return await service.register_worker(
            auth.account,
            body,
            token_issued_at=auth.token_issued_at,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.get("/accounts/{account_id}", response_model=AdminAccountDetails)
async def get_account(
    account_id: str,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
) -> AdminAccountDetails:
    try:
        return await service.get_account(account, account_id)
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.patch("/accounts/{account_id}/facility", response_model=MutationAckResponse)
async def change_facility(
    account_id: str,
    body: FacilityChangeRequest,
    auth: AuthContext = Depends(get_auth_context),
    service: AdministrationService = Depends(_service),
) -> MutationAckResponse:
    try:
        return await service.change_facility(
            auth.account,
            account_id,
            facility_id=body.facility_id,
            expected_version=body.expected_account_version,
            token_issued_at=auth.token_issued_at,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.post("/accounts/{account_id}/deactivate", response_model=MutationAckResponse)
async def deactivate_account(
    account_id: str,
    body: AccountVersionMutationRequest,
    auth: AuthContext = Depends(get_auth_context),
    service: AdministrationService = Depends(_service),
) -> MutationAckResponse:
    try:
        return await service.deactivate(
            auth.account,
            account_id,
            expected_version=body.expected_account_version,
            token_issued_at=auth.token_issued_at,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.post("/accounts/{account_id}/reactivate", response_model=MutationAckResponse)
async def reactivate_account(
    account_id: str,
    body: AccountVersionMutationRequest,
    auth: AuthContext = Depends(get_auth_context),
    service: AdministrationService = Depends(_service),
) -> MutationAckResponse:
    try:
        return await service.reactivate(
            auth.account,
            account_id,
            expected_version=body.expected_account_version,
            token_issued_at=auth.token_issued_at,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.post("/accounts/{account_id}/reset-access", response_model=MutationAckResponse)
async def reset_access(
    account_id: str,
    body: ResetAccessRequest,
    auth: AuthContext = Depends(get_auth_context),
    service: AdministrationService = Depends(_service),
) -> MutationAckResponse:
    try:
        return await service.reset_access(
            auth.account,
            account_id,
            expected_version=body.expected_account_version,
            temporary_password=body.temporary_password,
            token_issued_at=auth.token_issued_at,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.get("/accounts/{account_id}/devices", response_model=AdminDeviceListResponse)
async def list_devices(
    account_id: str,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
    x_device_id: Annotated[str | None, Header(alias="X-Device-Id")] = None,
) -> AdminDeviceListResponse:
    try:
        return await service.list_devices(
            account, account_id, current_device_id=x_device_id
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.post(
    "/accounts/{account_id}/devices/{device_id}/revoke",
    response_model=AdminDeviceItem,
)
async def revoke_device(
    account_id: str,
    device_id: str,
    auth: AuthContext = Depends(get_auth_context),
    service: AdministrationService = Depends(_service),
) -> AdminDeviceItem:
    try:
        return await service.revoke_device(
            auth.account,
            account_id,
            device_id,
            token_issued_at=auth.token_issued_at,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.get("/accounts/{account_id}/history", response_model=AdminHistoryResponse)
async def account_history(
    account_id: str,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: AdministrationService = Depends(_service),
) -> AdminHistoryResponse:
    try:
        return await service.history(account, account_id)
    except AdministrationError as exc:
        raise _http_error(exc) from exc


@router.patch(
    "/accounts/{account_id}/professional-profile",
    response_model=ProfessionalProfileResponse,
)
async def upsert_professional_profile(
    account_id: str,
    body: ProfessionalProfileUpsertRequest,
    auth: AuthContext = Depends(get_auth_context),
    service: AdministrationService = Depends(_service),
) -> ProfessionalProfileResponse:
    try:
        return await service.upsert_professional_profile(
            auth.account,
            account_id,
            body,
            token_issued_at=auth.token_issued_at,
        )
    except AdministrationError as exc:
        raise _http_error(exc) from exc
