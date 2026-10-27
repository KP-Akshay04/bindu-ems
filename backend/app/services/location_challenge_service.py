from datetime import datetime, timedelta
from hashlib import sha256
from hmac import compare_digest
from secrets import token_urlsafe
from uuid import uuid4

from flask import current_app

from app import db
from app.models.location_challenge import LocationChallenge


PENDING = "pending"
APPROVED = "approved"
COMPLETED = "completed"
CONSUMED = "consumed"
EXPIRED = "expired"
CANCELLED = "cancelled"
FAILED = "failed"


def utcnow():
    return datetime.utcnow()


def hash_token(token):
    return sha256(token.encode("utf-8")).hexdigest()


def expire_challenge_if_needed(challenge):
    if (
        challenge.status in {PENDING, APPROVED}
        and challenge.expires_at <= utcnow()
    ):
        challenge.status = EXPIRED
        return True

    return False


def create_location_challenge(employee):
    now = utcnow()
    rate_window = timedelta(
        minutes=current_app.config.get(
            "LOCATION_CHALLENGE_RATE_WINDOW_MINUTES",
            10,
        )
    )
    max_challenges = current_app.config.get(
        "LOCATION_CHALLENGE_MAX_PER_WINDOW",
        3,
    )

    recent_challenge_count = LocationChallenge.query.filter(
        LocationChallenge.employee_id == employee.employee_id,
        LocationChallenge.created_at >= now - rate_window,
    ).count()

    if recent_challenge_count >= max_challenges:
        return None, None, "rate_limited"

    active_challenges = LocationChallenge.query.filter(
        LocationChallenge.employee_id == employee.employee_id,
        LocationChallenge.status.in_([PENDING, APPROVED]),
    ).all()

    for challenge in active_challenges:
        challenge.status = (
            EXPIRED
            if challenge.expires_at <= now
            else CANCELLED
        )

    token = token_urlsafe(32)
    challenge = LocationChallenge(
        challenge_id=str(uuid4()),
        employee_id=employee.employee_id,
        branch_id=employee.branch_id,
        token_hash=hash_token(token),
        status=PENDING,
        expires_at=now + timedelta(
            seconds=current_app.config.get(
                "LOCATION_CHALLENGE_TTL_SECONDS",
                120,
            )
        ),
    )

    db.session.add(challenge)
    db.session.commit()

    return challenge, token, None



def get_location_challenge(
    challenge_id,
    token,
    statuses=None,
    lock=False,
):
    if lock:
        challenge = (
            LocationChallenge.query
            .filter_by(challenge_id=str(challenge_id))
            .with_for_update()
            .first()
        )
    else:
        challenge = db.session.get(
            LocationChallenge,
            str(challenge_id),
        )

    if (
        not challenge
        or not token
        or not compare_digest(
            challenge.token_hash,
            hash_token(token),
        )
    ):
        return None, "not_found"

    if expire_challenge_if_needed(challenge):
        if not lock:
            db.session.commit()
        return None, EXPIRED

    if statuses and challenge.status not in statuses:
        return None, challenge.status

    return challenge, None



def consume_completed_location_challenge(
    challenge_id,
    employee_id,
):
    challenge = (
        LocationChallenge.query
        .filter_by(challenge_id=str(challenge_id))
        .with_for_update()
        .first()
    )

    if (
        not challenge
        or challenge.employee_id != employee_id
        or challenge.status != COMPLETED
        or challenge.expires_at <= utcnow()
        or challenge.latitude is None
        or challenge.longitude is None
        or challenge.accuracy is None
    ):
        return None

    return challenge


def consume_location_challenge(challenge):
    challenge.status = CONSUMED
    challenge.consumed_at = utcnow()
    challenge.latitude = None
    challenge.longitude = None
    challenge.accuracy = None
    challenge.distance = None
    challenge.allowed_radius = None
