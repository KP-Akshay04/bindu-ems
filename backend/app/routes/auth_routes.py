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

    # Super Admin can access every portal
    if employee_role in [
        "super admin",
        "super_admin",
        "admin"
    ]:
        pass

    elif portal == "hr" and employee_role not in [
        "hr",
        "hr admin",
        "hr_admin"
    ]:
        return jsonify({

            "success": False,
            "message": "Only HR can log in through the HR portal."
    }), 403

    elif portal == "employee" and employee_role != "employee":
        return jsonify({

        "success": False,
        "message": "Only Employees can log in through the Employee portal."
    }), 403

    elif portal not in ["admin", "hr", "employee"]:
        return jsonify({
            
        "success": False,
        "message": "Invalid login portal."
    }), 400

    return jsonify({
        "success": True,
        "employee_id": employee.employee_id,
        "employee_code": employee.employee_code,
        "full_name": employee.full_name,
        "email": employee.email,
        "designation": employee.designation,
        "role": (
    "HR"
    if str(employee.role).strip().lower() in ["hr", "hr admin", "hr_admin"]
    else (
        "Super Admin"
        if str(employee.role).strip().lower() in ["super admin", "admin", "super_admin"]
        else "Employee"
    )
),
        "phone": employee.phone,
        "status": employee.status,
        "employee_photo": employee.employee_photo,
    })