"""Pydantic schemas for NorthCare Reach public and worker APIs."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, extra="forbid")


class PublicCreateRequest(CamelModel):
    channel: Literal["ussdSimulator", "ussdAfricasTalkingSandbox"]
    category: str
    request_type: str = Field(alias="requestType")
    contact_number: str = Field(alias="contactNumber")
    community_or_landmark: str = Field(alias="communityOrLandmark")
    preferred_language: str = Field(alias="preferredLanguage")
    consent_to_contact: bool = Field(alias="consentToContact")
    consent_to_share_location: bool = Field(alias="consentToShareLocation")


class PublicCreateResponse(CamelModel):
    reference_code: str = Field(alias="referenceCode")
    status_pin: str = Field(alias="statusPin")
    public_message: str = Field(alias="publicMessage")
    simulation_notice: str | None = Field(default=None, alias="simulationNotice")
    emergency_reminder: str | None = Field(default=None, alias="emergencyReminder")


class PublicStatusRequest(CamelModel):
    reference_code: str = Field(alias="referenceCode")
    status_pin: str = Field(alias="statusPin")


class PublicStatusResponse(CamelModel):
    public_status_label: str = Field(alias="publicStatusLabel")


class WorkerVersionMutationRequest(CamelModel):
    expected_version: int = Field(alias="expectedVersion", ge=1)


class WorkerRequestListItem(CamelModel):
    request_id: str = Field(alias="requestId")
    category: str
    request_type: str = Field(alias="requestType")
    community_or_landmark: str = Field(alias="communityOrLandmark")
    preferred_language: str = Field(alias="preferredLanguage")
    status: str
    assigned_to_caller: bool = Field(alias="assignedToCaller")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    version: int


class WorkerRequestListResponse(CamelModel):
    items: list[WorkerRequestListItem]


class WorkerRequestDetailResponse(CamelModel):
    request_id: str = Field(alias="requestId")
    category: str
    request_type: str = Field(alias="requestType")
    contact_number: str = Field(alias="contactNumber")
    community_or_landmark: str = Field(alias="communityOrLandmark")
    preferred_language: str = Field(alias="preferredLanguage")
    consent_to_contact: bool = Field(alias="consentToContact")
    consent_to_share_location: bool = Field(alias="consentToShareLocation")
    status: str
    assigned_to_caller: bool = Field(alias="assignedToCaller")
    assigned_worker_id: str | None = Field(default=None, alias="assignedWorkerId")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    version: int
    handled_means: str = Field(
        default="Handled refers to the community request workflow, not clinical care completion.",
        alias="handledMeans",
    )


class WorkerMutationResponse(CamelModel):
    request_id: str = Field(alias="requestId")
    status: str
    version: int
    assigned_worker_id: str | None = Field(default=None, alias="assignedWorkerId")
    message: str | None = None
