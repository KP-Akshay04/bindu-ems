from app import db
from datetime import datetime


class Employee(db.Model):
    __tablename__ = "employees"

    employee_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_code = db.Column(
        db.String(20),
        unique=True,
        nullable=False
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    phone = db.Column(
        db.String(20)
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    branch_id = db.Column(
        db.Integer,
        db.ForeignKey("branches.branch_id")
    )

    department_id = db.Column(
        db.Integer,
        db.ForeignKey("departments.department_id")
    )

    designation = db.Column(
        db.String(100)
    )

    joining_date = db.Column(
        db.Date
    )

    basic_salary = db.Column(
        db.Float,
        default=0
    )

    leave_balance = db.Column(
        db.Integer,
        default=12
    )

    employee_photo = db.Column(
        db.String(255)
    )

    status = db.Column(
        db.String(20),
        default="active"
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
        return f"<Employee {self.full_name}>"