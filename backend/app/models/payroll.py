from app import db


class Payroll(db.Model):
    __tablename__ = "payroll"

    payroll_id = db.Column(
        db.Integer,
        primary_key=True
    )

    employee_id = db.Column(
        db.Integer,
        db.ForeignKey("employees.employee_id")
    )

    basic_salary = db.Column(
        db.Float,
        nullable=False
    )

    allowances = db.Column(
        db.Float,
        default=0
    )

    deductions = db.Column(
        db.Float,
        default=0
    )

    net_salary = db.Column(
        db.Float,
        nullable=False
    )

    month = db.Column(
        db.Integer,
        nullable=False
    )

    year = db.Column(
        db.Integer,
        nullable=False
    )

    status = db.Column(
    db.String(20),
    default="Processing"
    )

    paid_date = db.Column(
        db.Date
    )
    
