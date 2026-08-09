from app import db
from datetime import datetime


class RolePermission(db.Model):
    __tablename__ = "role_permissions"

    role_permission_id = db.Column(
        db.Integer,
        primary_key=True
    )

    role = db.Column(
        db.String(50),
        nullable=False
    )

    permission_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "permissions.permission_id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    enabled = db.Column(
        db.Boolean,
        nullable=False,
        default=False
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

    permission = db.relationship(
        "Permission",
        backref=db.backref(
            "role_permissions",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    def __repr__(self):
        return (
            f"<RolePermission "
            f"{self.role} -> "
            f"{self.permission_id}>"
        )