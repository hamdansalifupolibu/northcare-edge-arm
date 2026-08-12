"""Approved Ask NorthCare FAQ pack for community USSD (English, FAQ-only).

Hackathon slice: static community-information templates only.
No LLM, diagnosis, prescription, dosage, or invented clinical/Dagbanli content.
"""

from __future__ import annotations

from dataclasses import dataclass

# Shown under every FAQ answer (USSD-short).
ANSWER_DISCLAIMER = (
    "Not a diagnosis. Emergencies: call 112.\n"
    "For care, talk to a health worker."
)

EMERGENCY_ESCALATION = (
    "If someone is in immediate danger, end this session and dial 112 now.\n\n"
    "NorthCare has not placed the call.\n\n"
    f"{ANSWER_DISCLAIMER}"
)

# Keywords that force emergency escalation copy (not a symptom classifier).
_EMERGENCY_KEYWORDS: tuple[str, ...] = (
    "112",
    "emergency",
    "immediate danger",
    "in danger",
    "dying",
    "unconscious",
    "not breathing",
    "severe bleeding",
    "bleeding heavily",
    "ambulance",
)


@dataclass(frozen=True, slots=True)
class FaqEntry:
    key: str
    menu_choice: str
    label: str
    answer: str
    keywords: tuple[str, ...]
    is_emergency: bool = False


# Short approved community answers — no clinical advice.
FAQ_ENTRIES: tuple[FaqEntry, ...] = (
    FaqEntry(
        key="what_is_reach",
        menu_choice="1",
        label="What is NorthCare Reach?",
        answer=(
            "NorthCare Reach is community information support.\n"
            "You can request a CHPS worker follow-up and check "
            "request status from the USSD menu.\n\n"
            "It is not clinical advice and does not replace "
            "a health worker."
        ),
        keywords=(
            "what is northcare",
            "what is reach",
            "about northcare",
            "about reach",
            "northcare reach",
            "what does this do",
            "who is northcare",
        ),
    ),
    FaqEntry(
        key="request_chps",
        menu_choice="2",
        label="How do I request a CHPS visit?",
        answer=(
            "From the main menu choose 4 Request a CHPS worker.\n"
            "Select a reason, enter community or landmark, "
            "a callback number, and consent.\n\n"
            "Or choose Request worker follow-up below."
        ),
        keywords=(
            "request chps",
            "chps visit",
            "request a worker",
            "request worker",
            "call a nurse",
            "health worker visit",
            "how do i request",
            "community visit",
        ),
    ),
    FaqEntry(
        key="status_pin",
        menu_choice="3",
        label="How does my status PIN work?",
        answer=(
            "After you send a request you get a reference and a "
            "six-digit status PIN shown once.\n"
            "Use main menu 5 to check status.\n"
            "Keep the PIN private. Do not share it."
        ),
        keywords=(
            "status pin",
            "pin work",
            "my pin",
            "reference",
            "check status",
            "follow-up pin",
            "six-digit",
            "6 digit",
        ),
    ),
    FaqEntry(
        key="hours",
        menu_choice="4",
        label="CHPS or clinic hours",
        answer=(
            "Opening hours vary by community and facility.\n"
            "Ask your local CHPS compound or health facility "
            "for times.\n"
            "You can also request a worker follow-up."
        ),
        keywords=(
            "hours",
            "opening time",
            "open time",
            "when open",
            "clinic hours",
            "chps hours",
            "facility hours",
            "what time",
        ),
    ),
    FaqEntry(
        key="emergency_112",
        menu_choice="5",
        label="Emergency - call 112",
        answer=EMERGENCY_ESCALATION,
        keywords=(
            "emergency",
            "call 112",
            "dial 112",
            "112",
            "urgent help",
        ),
        is_emergency=True,
    ),
)

FAQ_BY_CHOICE: dict[str, FaqEntry] = {e.menu_choice: e for e in FAQ_ENTRIES}
FAQ_BY_KEY: dict[str, FaqEntry] = {e.key: e for e in FAQ_ENTRIES}

ASK_MENU_SHORTCUTS = (
    "ASK NORTHCARE\n"
    "Information support - not clinical advice\n\n"
    "1. What is NorthCare Reach?\n"
    "2. How do I request a CHPS visit?\n"
    "3. How does my status PIN work?\n"
    "4. CHPS or clinic hours\n"
    "5. Emergency - call 112\n"
    "6. Request worker follow-up\n"
    "Or type a short community question\n"
    "0. Emergency help\n"
    "9. Back"
)

NO_MATCH_MESSAGE = (
    "ASK NORTHCARE\n"
    "No matching approved answer found.\n\n"
    "This service shares approved community information only.\n"
    "It does not diagnose symptoms or give treatment advice.\n\n"
    f"{ANSWER_DISCLAIMER}\n\n"
    "1. Request worker follow-up\n"
    "0. Emergency help\n"
    "9. Back"
)


def format_faq_answer_screen(entry: FaqEntry) -> str:
    """Build CON screen text for an approved FAQ answer."""
    body = entry.answer.strip()
    if entry.is_emergency:
        # Emergency answer already embeds the disclaimer.
        return (
            f"ASK NORTHCARE\n\n{body}\n\n"
            "1. End and call 112\n"
            "2. Request urgent CHPS callback\n"
            "6. Request worker follow-up\n"
            "9. Back"
        )
    return (
        f"ASK NORTHCARE\n\n{body}\n\n"
        f"{ANSWER_DISCLAIMER}\n\n"
        "1. Request worker follow-up\n"
        "0. Emergency help\n"
        "9. Back"
    )


def looks_like_emergency_question(text: str) -> bool:
    normalised = " ".join(text.lower().split())
    if not normalised:
        return False
    return any(token in normalised for token in _EMERGENCY_KEYWORDS)


def match_faq(text: str) -> FaqEntry | None:
    """Best-effort keyword match against the approved FAQ pack.

    Returns None when no safe template applies (caller offers worker handoff).
    Does not invent clinical answers.
    """
    normalised = " ".join(text.lower().split())
    if not normalised or len(normalised) > 200:
        return None

    if looks_like_emergency_question(normalised):
        return FAQ_BY_KEY["emergency_112"]

    best: FaqEntry | None = None
    best_score = 0
    for entry in FAQ_ENTRIES:
        if entry.is_emergency:
            continue
        score = 0
        for kw in entry.keywords:
            if kw in normalised:
                score += len(kw)
        if score > best_score:
            best_score = score
            best = entry
    # Require a minimal keyword hit so short noise does not fake-match.
    if best is None or best_score < 4:
        return None
    return best
