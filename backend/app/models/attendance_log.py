from app import db


class AttendanceLog(db.Model):
    __tablename__ = "attendance_logs"

    log_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_id = db.Column(
        db.Integer,
        nullable=False
    )

    action = db.Column(
        db.String(30),
        nullable=False
    )

    timestamp = db.Column(
        db.DateTime,
        nullable=False
    )

    def __repr__(self):
        return (
            f"<AttendanceLog "
            f"{self.employee_id} "
            f"{self.action}>"
        )