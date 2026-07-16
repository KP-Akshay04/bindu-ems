from app import db
from datetime import datetime


class Designation(db.Model):
    __tablename__ = "designations"

    designation_id = db.Column(
        db.Integer,
        primary_key=True
    )

    designation_name = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    status = db.Column(
        db.String(20),
        default="Active"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<Designation {self.designation_name}>"