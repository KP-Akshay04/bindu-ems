from flask import Blueprint, request, jsonify
from datetime import date
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

    net_salary = (
        basic_salary +
        allowances -
        deductions
    )

    payroll = Payroll(
    employee_id=data["employee_id"],
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

    payrolls = Payroll.query.all()

    result = []

    for payroll in payrolls:

        result.append({
            "payroll_id": payroll.payroll_id,
            "employee_id": payroll.employee_id,
            "basic_salary": payroll.basic_salary,
            "allowances": payroll.allowances,
            "deductions": payroll.deductions,
            "net_salary": payroll.net_salary,
            "month": payroll.month,
            "year": payroll.year,
            "status": payroll.status,
            "paid_date": str(payroll.paid_date)
                if payroll.paid_date
                else None
})
    return jsonify(result)

@payroll_bp.route("/api/payroll/<int:id>/pay",methods=["PUT"])
def mark_paid(id):

    payroll = Payroll.query.get_or_404(id)

    payroll.status = "Paid"
    payroll.paid_date = date.today()

    db.session.commit()

    return jsonify({
        "message": "Payroll marked as paid"
    })