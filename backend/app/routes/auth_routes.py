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

    return jsonify({
    "success": True,
    "employee_id": employee.employee_id,
    "employee_code": employee.employee_code,
    "full_name": employee.full_name,
    "email": employee.email,
    "designation": employee.designation,
    "role": employee.role
}), 200
