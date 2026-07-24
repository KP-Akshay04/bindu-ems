from app import db


class Attendance(db.Model):
    __tablename__ = "attendance"

    attendance_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey("employees.employee_id"),
        nullable=False
    )

    attendance_date = db.Column(
        db.Date,
        nullable=False
    )

    login_time = db.Column(
        db.DateTime
    )

    logout_time = db.Column(
        db.DateTime
    )

    working_seconds = db.Column(
        db.Integer,
        default=0
    )

    lunch_seconds = db.Column(
        db.Integer,
        default=0
    )

    lunch_start_time = db.Column(
        db.DateTime,
        nullable=True
    )

    lunch_end_time = db.Column(
        db.DateTime,
        nullable=True
    )

    status = db.Column(
        db.String(20),
        default="Present"
    )

    # ---------------- GPS ----------------

    login_latitude = db.Column(
        db.Float,
        nullable=True
    )

    login_longitude = db.Column(
        db.Float,
        nullable=True
    )

    login_address = db.Column(
        db.String(255),
        nullable=True
    )

    distance_from_branch = db.Column(
        db.Float,
        nullable=True
    )

    def __repr__(self):
        return f"<Attendance {self.employee_id}>"