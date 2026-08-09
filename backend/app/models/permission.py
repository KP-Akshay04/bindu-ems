from app import db


class Permission(db.Model):
    __tablename__ = "permissions"

    permission_id = db.Column(
        db.Integer,
        primary_key=True
    )

    permission_key = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    permission_name = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.String(255)
    )

    def __repr__(self):
        return f"<Permission {self.permission_key}>"