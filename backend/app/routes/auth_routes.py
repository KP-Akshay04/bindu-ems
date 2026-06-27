from flask import Blueprint, request, jsonify

from app.models.employee import Employee
from app.utils.security import verify_password

auth_bp = Blueprint(
    "auth_bp",
    __name__
)


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():

    data = request.get_json()

    employee_code = data.get("employee_id")
    password = data.get("password")
    portal = str(data.get("role", "")).lower()

    employee = Employee.query.filter_by(
        employee_code=employee_code
    ).first()

    if not employee:
        return jsonify({
            "success": False,
            "message": "Invalid Employee ID"
        }), 401

    if not verify_password(
        password,
        employee.password_hash
    ):
        return jsonify({
            "success": False,
            "message": "Invalid Password"
        }), 401

    employee_role = str(employee.role).lower()

    allowed = {
        "admin": [
            "super admin",
            "super_admin",
            "admin"
        ],
        "hr": [
            "hr",
            "hr admin",
            "hr_admin"
        ],
        "employee": [
            "employee"
        ]
    }

    if portal not in allowed:
        return jsonify({
            "success": False,
            "message": "Invalid login portal."
        }), 400

    if employee_role not in allowed[portal]:
        return jsonify({
            "success": False,
            "message": f"You are not authorized to log in through the {portal.title()} portal."
        }), 403

    return jsonify({
        "success": True,
        "employee_id": employee.employee_id,
        "employee_code": employee.employee_code,
        "full_name": employee.full_name,
        "email": employee.email,
        "designation": employee.designation,
        "role": employee.role,
        "phone": employee.phone,
        "status": employee.status,
        "employee_photo": employee.employee_photo,
    })