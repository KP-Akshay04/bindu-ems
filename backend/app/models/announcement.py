from app import db
from datetime import datetime


class Announcement(db.Model):
    __tablename__ = "announcements"

    announcement_id = db.Column(
        db.Integer,
        primary_key=True
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("employees.employee_id")
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )