from datetime import date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    verify_jwt_in_request,
)

from app import db
from app.models.payroll import Payroll
from app.models.employee import Employee
from app.models.department import Department
from app.models.designation import Designation
from app.models.branch import Branch
from app.utils.authorization import has_permission


payroll_bp = Blueprint(
    "payroll_bp",
    __name__
)


# ============================================================
# AUTHORIZATION HELPERS
# ============================================================

def get_current_user_context():
    """
    Returns the currently authenticated user's
    employee ID and role.
    """

    verify_jwt_in_request()

    identity = get_jwt_identity()
    claims = get_jwt()

    role = str(
        claims.get("role", "")
    ).strip()

    return identity, role


def is_super_admin(role):
    return role.lower() in [
        "super admin",
        "super_admin",
        "admin"
    ]


def can_manage_payroll(role):
    """
    Super Admin always has access.

    HR requires the database-controlled
    hr_payroll permission.
    """

    if is_super_admin(role):
        return True

    if role.lower() == "hr":
        return has_permission(
            role,
            "hr_payroll"
        )

    return False


# ============================================================
# CREATE PAYROLL
# SUPER ADMIN / HR WITH PAYROLL PERMISSION
# ============================================================

@payroll_bp.route(
    "/api/payroll",
    methods=["POST"]
)
def create_payroll():

    _, role = get_current_user_context()

    if not can_manage_payroll(role):

        return jsonify({
            "success": False,
            "message": "Access denied. Payroll permission is required."
        }), 403

    data = request.get_json() or {}

    # --------------------------------------------------------
    # Validate required fields
    # --------------------------------------------------------

    required_fields = [
        "employee_id",
        "basic_salary",
        "month",
        "year"
    ]

    missing_fields = [
        field
        for field in required_fields
        if data.get(field) is None
    ]

    if missing_fields:

        return jsonify({
            "success": False,
            "message": (
                "Missing required fields: "
                + ", ".join(missing_fields)
            )
        }), 400

    # --------------------------------------------------------
    # Validate employee
    # --------------------------------------------------------

    try:
        employee_id = int(
            data["employee_id"]
        )
    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "message": "Invalid employee_id."
        }), 400

    employee = Employee.query.get(
        employee_id
    )

    if not employee:

        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    # --------------------------------------------------------
    # Validate salary values
    # --------------------------------------------------------

    try:
        basic_salary = float(
            data["basic_salary"]
        )

        allowances = float(
            data.get("allowances", 0)
        )

        deductions = float(
            data.get("deductions", 0)
        )

    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "message": "Salary values must be valid numbers."
        }), 400

    if basic_salary < 0:

        return jsonify({
            "success": False,
            "message": "Basic salary cannot be negative."
        }), 400

    if allowances < 0:

        return jsonify({
            "success": False,
            "message": "Allowances cannot be negative."
        }), 400

    if deductions < 0:

        return jsonify({
            "success": False,
            "message": "Deductions cannot be negative."
        }), 400

    # --------------------------------------------------------
    # Prevent duplicate payroll
    # --------------------------------------------------------

    existing = Payroll.query.filter_by(
        employee_id=employee_id,
        month=data["month"],
        year=data["year"]
    ).first()

    if existing:

        return jsonify({
            "success": False,
            "message":
                "Payroll already exists for this employee and month."
        }), 400

    # --------------------------------------------------------
    # Calculate net salary
    # --------------------------------------------------------

    net_salary = (
        basic_salary
        + allowances
        - deductions
    )

    # --------------------------------------------------------
    # Create payroll
    # --------------------------------------------------------

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
        "success": True,
        "message": "Payroll created successfully",
        "net_salary": net_salary
    }), 201


# ============================================================
# GET PAYROLL
#
# SUPER ADMIN:
#     Full access
#
# HR:
#     Requires hr_payroll permission
#
# EMPLOYEE:
#     Own payroll only
# ============================================================

@payroll_bp.route(
    "/api/payroll",
    methods=["GET"]
)
def get_payroll():

    current_employee_id, role = (
        get_current_user_context()
    )

    # --------------------------------------------------------
    # Requested employee
    # --------------------------------------------------------

    requested_employee_id = (
        request.args.get("employee_id")
    )

    # --------------------------------------------------------
    # Employee access
        #
        # Employees can ONLY request their own payroll.
    # --------------------------------------------------------

    if role.lower() == "employee":

        if not requested_employee_id:

            return jsonify({
                "success": False,
                "message":
                    "Employee ID is required."
            }), 403

        if str(requested_employee_id) != str(
            current_employee_id
        ):

            return jsonify({
                "success": False,
                "message":
                    "Access denied. You can only view your own payroll."
            }), 403

        payrolls = (
            Payroll.query
            .filter_by(
                employee_id=current_employee_id
            )
            .all()
        )

    # --------------------------------------------------------
    # Super Admin / HR management access
    # --------------------------------------------------------

    else:

        if not can_manage_payroll(role):

            return jsonify({
                "success": False,
                "message":
                    "Access denied. Payroll permission is required."
            }), 403

        if requested_employee_id:

            payrolls = (
                Payroll.query
                .filter_by(
                    employee_id=requested_employee_id
                )
                .all()
            )

        else:

            payrolls = Payroll.query.all()

    # --------------------------------------------------------
    # Build response
    # --------------------------------------------------------

    result = []

    for payroll in payrolls:

        employee = Employee.query.get(
            payroll.employee_id
        )

        department = (
            Department.query.get(
                employee.department_id
            )
            if employee and employee.department_id
            else None
        )

        designation = (
            Designation.query.get(
                employee.designation_id
            )
            if employee and employee.designation_id
            else None
        )

        branch = (
            Branch.query.get(
                employee.branch_id
            )
            if employee and employee.branch_id
            else None
        )

        result.append({

            "department_name":
                department.department_name
                if department
                else None,

            "designation_name":
                designation.designation_name
                if designation
                else None,

            "branch_name":
                branch.branch_name
                if branch
                else None,

            "payroll_id":
                payroll.payroll_id,

            "employee_id":
                payroll.employee_id,

            "employee_name":
                employee.full_name
                if employee
                else None,

            "employee_code":
                employee.employee_code
                if employee
                else None,

            "role":
                employee.role
                if employee
                else None,

            "joining_date":
                str(employee.joining_date)
                if employee and employee.joining_date
                else None,

            "basic_salary":
                payroll.basic_salary,

            "allowances":
                payroll.allowances,

            "deductions":
                payroll.deductions,

            "net_salary":
                payroll.net_salary,

            "month":
                payroll.month,

            "year":
                payroll.year,

            "status":
                payroll.status,

            "pay_date":
                str(payroll.paid_date)
                if payroll.paid_date
                else None
        })

    return jsonify(result), 200


# ============================================================
# MARK PAYROLL AS PAID
# SUPER ADMIN / HR WITH PAYROLL PERMISSION
# ============================================================

@payroll_bp.route(
    "/api/payroll/<int:id>/pay",
    methods=["PUT"]
)
def mark_paid(id):

    _, role = get_current_user_context()

    if not can_manage_payroll(role):

        return jsonify({
            "success": False,
            "message":
                "Access denied. Payroll permission is required."
        }), 403

    payroll = Payroll.query.get_or_404(id)

    if payroll.status == "Paid":

        return jsonify({
            "success": False,
            "message":
                "Payroll already marked as paid"
        }), 400

    payroll.status = "Paid"
    payroll.paid_date = date.today()

    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Payroll marked as paid"
    }), 200