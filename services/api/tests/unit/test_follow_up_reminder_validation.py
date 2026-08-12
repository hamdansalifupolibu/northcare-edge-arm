from __future__ import annotations

import pytest

from northcare_api.services.sync_push import _validate_follow_up_reminder


def test_reminder_rejects_device_local_metadata() -> None:
    with pytest.raises(ValueError, match="REMINDER_DEVICE_METADATA_FORBIDDEN"):
        _validate_follow_up_reminder(
            {
                "reminderType": "generalFollowUp",
                "status": "active",
                "scheduledForUtc": "2099-01-01T09:00:00Z",
                "originalLocalDate": "2099-01-01",
                "originalLocalTime": "09:00",
                "originalTimeZone": "Africa/Accra",
                "nativeNotificationId": "should-not-sync",
            }
        )


def test_reminder_accepts_sync_safe_payload() -> None:
    _validate_follow_up_reminder(
        {
            "reminderType": "generalFollowUp",
            "status": "active",
            "scheduledForUtc": "2099-01-01T09:00:00Z",
            "originalLocalDate": "2099-01-01",
            "originalLocalTime": "09:00",
            "originalTimeZone": "Africa/Accra",
            "note": "private note",
        }
    )


def test_reminder_rejects_invalid_type() -> None:
    with pytest.raises(ValueError, match="REMINDER_VALIDATION_FAILED"):
        _validate_follow_up_reminder(
            {
                "reminderType": "emergency",
                "status": "active",
                "scheduledForUtc": "2099-01-01T09:00:00Z",
                "originalLocalDate": "2099-01-01",
                "originalLocalTime": "09:00",
                "originalTimeZone": "Africa/Accra",
            }
        )
