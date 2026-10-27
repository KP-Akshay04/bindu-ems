from datetime import datetime

from app import db


class LocationChallenge(db.Model):
    __tablename__ = "location_challenges"

    challenge_id = db.Column(
        db.String(36),
        primary_key=True,
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey("employees.employee_id"),
        nullable=False,
        index=True,
    )

    branch_id = db.Column(
        db.Integer,
        db.ForeignKey("branches.branch_id"),
        nullable=True,
    )

    token_hash = db.Column(
        db.String(64),
        nullable=False,
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending",
        index=True,
    )

    attempt_count = db.Column(
        db.Integer,
        nullable=False,
        default=0,
    )

    expires_at = db.Column(
        db.DateTime,
        nullable=False,
        index=True,
    )

    approved_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    completed_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    consumed_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    latitude = db.Column(
        db.Float,
        nullable=True,
    )

    longitude = db.Column(
        db.Float,
        nullable=True,
    )

    accuracy = db.Column(
        db.Float,
        nullable=True,
    )

    distance = db.Column(
        db.Float,
        nullable=True,
    )

    allowed_radius = db.Column(
        db.Float,
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    def __repr__(self):
        return (
            f"<LocationChallenge {self.challenge_id} "
            f"{self.status}>"
        )
