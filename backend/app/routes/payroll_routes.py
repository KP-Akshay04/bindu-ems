from flask import Blueprint, request, jsonify
from datetime import date
from app.models.employee import Employee
from app import db
from app.models.payroll import Payroll

payroll_bp = Blueprint(
    "payroll_bp",
    __name__
)


@payroll_bp.route("/api/payroll", methods=["POST"])
def create_payroll():

    data = request.get_json()

    basic_salary = float(
        data["basic_salary"]
    )

    allowances = float(
        data.get("allowances", 0)
    )

    deductions = float(
        data.get("deductions", 0)
    )

    if basic_salary < 0:
        return jsonify({
            "message": "Basic salary cannot be negative"
        }), 400

    if allowances < 0:
        return jsonify({
            "message": "Allowances cannot be negative"
        }), 400

    if deductions < 0:
        return jsonify({
            "message": "Deductions cannot be negative"
        }), 400

    existing = Payroll.query.filter_by(
        employee_id=employee_id,
        month=data["month"],
        year=data["year"]
    ).first()

    if existing:
        return jsonify({
            "message":
            "Payroll already exists for this employee and month"
        }), 400

    net_salary = (
        basic_salary +
        allowances -
        deductions
    )

    payroll = Payroll(
        employee_id=employee_id,
        basic_salary=basic_salary,
        allowances=allowances,
        deductions=deductions,
        net_salary=net_salary,
        month=data["month"],
        year=data["year"],
        status="Processing"
    )

    db.session.add(payroll)
    db.session.commit()

    return jsonify({
        "message": "Payroll created successfully",
        "net_salary": net_salary
    }), 201


@payroll_bp.route("/api/payroll", methods=["GET"])
def get_payroll():

    employee_id = request.args.get(
        "employee_id"
    )

    if employee_id:
        payrolls = Payroll.query.filter_by(
            employee_id=employee_id
        ).all()
    else:
        payrolls = Payroll.query.all()

    result = []

    for payroll in payrolls:

        employee = Employee.query.get(
            payroll.employee_id
        )

        result.append({
            "payroll_id": payroll.payroll_id,

            "employee_id": payroll.employee_id,

            "employee_name":
                employee.full_name if employee else None,

            "employee_code":
                employee.employee_code if employee else None,

            "role":
                employee.role if employee else None,

            "basic_salary": payroll.basic_salary,
            "allowances": payroll.allowances,
            "deductions": payroll.deductions,
            "net_salary": payroll.net_salary,
            "month": payroll.month,
            "year": payroll.year,
            "status": payroll.status,

            "paid_date":
                str(payroll.paid_date)
                if payroll.paid_date
                else None
        })

    return jsonify(result)


@payroll_bp.route(
    "/api/payroll/<int:id>/pay",
    methods=["PUT"]
)
def mark_paid(id):

    payroll = Payroll.query.get_or_404(id)

    if payroll.status == "Paid":
        return jsonify({
            "message":
            "Payroll already marked as paid"
        }), 400

    payroll.status = "Paid"
    payroll.paid_date = date.today()

    db.session.commit()

    return jsonify({
        "message":
        "Payroll marked as paid"
    })