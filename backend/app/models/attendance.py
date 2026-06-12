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

    working_hours = db.Column(
        db.Float,
        default=0
    )

    status = db.Column(
        db.String(20),
        default="Present"
    )

    def __repr__(self):
        return f"<Attendance {self.employee_id}>"