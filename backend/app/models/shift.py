from app import db


class Shift(db.Model):
    __tablename__ = "shifts"

    shift_id = db.Column(
        db.Integer,
        primary_key=True
    )

    shift_name = db.Column(
        db.String(100),
        nullable=False
    )

    start_time = db.Column(
        db.Time,
        nullable=False
    )

    end_time = db.Column(
        db.Time,
        nullable=False
    )

    grace_minutes = db.Column(
        db.Integer,
        default=15
    )

    def __repr__(self):
        return f"<Shift {self.shift_name}>"