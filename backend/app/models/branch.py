from app import db


class Branch(db.Model):
    __tablename__ = "branches"

    branch_id = db.Column(
        db.Integer,
        primary_key=True
    )

    branch_name = db.Column(
        db.String(100),
        nullable=False
    )

    location = db.Column(
        db.String(255)
    )

    latitude = db.Column(
        db.Float
    )

    longitude = db.Column(
        db.Float
    )

    allowed_radius = db.Column(
        db.Integer,
        default=100
    )

    def __repr__(self):
        return f"<Branch {self.branch_name}>"