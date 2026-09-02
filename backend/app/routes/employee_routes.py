from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from datetime import datetime
import os

from app import db
from app.models.employee import Employee
from app.utils.security import hash_password, verify_password
from app.utils.employee_serializer import serialize_employee


employee_bp = Blueprint(
    "employee_bp",
    __name__
)


# =========================================================
# AUTHORIZATION HELPERS
# =========================================================

def require_management_access():
    """
    Employee management is restricted to Super Admin and HR.

    Returns:
        None when authorized.
        Flask response tuple when access is denied.
    """

    verify_jwt_in_request()

    claims = get_jwt()

    role = str(
        claims.get("role", "")
    ).strip().lower()

    if role not in [
        "super admin",
        "admin",
        "super_admin",
        "hr",
        "hr admin",
        "hr_admin"
    ]:
        return jsonify({
            "success": False,
            "message": "Access denied. Employee management is restricted."
        }), 403

    return None


def get_current_employee_id():
    """
    Return the employee ID stored in the JWT identity.
    """

    verify_jwt_in_request()

    from flask_jwt_extended import get_jwt_identity

    return int(get_jwt_identity())


# =========================================================
# CREATE EMPLOYEE
# =========================================================

@employee_bp.route(
    "/api/employees",
    methods=["POST"]
)
def create_employee():

    denied = require_management_access()

    if denied:
        return denied

    data = request.get_json() or {}

    employee_code = str(
        data.get("employee_code", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip()

    if not employee_code:
        return jsonify({
            "message": "Employee code is required."
        }), 400

    if not data.get("full_name"):
        return jsonify({
            "message": "Full name is required."
        }), 400

    if not email:
        return jsonify({
            "message": "Email is required."
        }), 400

    if not data.get("password"):
        return jsonify({
            "message": "Password is required."
        }), 400

    # Check duplicate employee code
    if Employee.query.filter_by(
        employee_code=employee_code
    ).first():

        return jsonify({
            "message": "Employee code already exists"
        }), 409

    # Check duplicate email
    if Employee.query.filter_by(
        email=email
    ).first():

        return jsonify({
            "message": "Email already exists"
        }), 409

    employee = Employee(
        employee_code=employee_code,
        full_name=data["full_name"],
        email=email,
        phone=data.get("phone"),

        password_hash=hash_password(
            data["password"]
        ),

        designation_id=data.get("designation_id"),
        shift_id=data.get("shift_id"),
        branch_id=data.get("branch_id"),
        department_id=data.get("department_id"),

        joining_date=(
            datetime.strptime(
                data["joining_date"],
                "%Y-%m-%d"
            ).date()
            if data.get("joining_date")
            else None
        ),

        role=data.get(
            "role",
            "Employee"
        ),

        status=data.get(
            "status",
            "active"
        ),

        basic_salary=data.get(
            "basic_salary",
            0
        ),

        leave_balance=data.get(
            "leave_balance",
            12
        ),
    )

    db.session.add(employee)

    try:
        db.session.commit()

        return jsonify({
            "message": "Employee created successfully"
        }), 201

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "message": "Failed to create employee",
            "error": str(e)
        }), 500


# =========================================================
# GET EMPLOYEES
# =========================================================

@employee_bp.route(
    "/api/employees",
    methods=["GET"]
)
def get_employees():

    denied = require_management_access()

    if denied:
        return denied

    employees = Employee.query.all()

    return jsonify([
        serialize_employee(emp)
        for emp in employees
    ])


# =========================================================
# UPDATE EMPLOYEE
# =========================================================

@employee_bp.route(
    "/api/employees/<int:id>",
    methods=["PUT"]
)
def update_employee(id):

    denied = require_management_access()

    if denied:
        return denied

    employee = Employee.query.get_or_404(id)

    data = request.get_json() or {}

    employee.full_name = data.get(
        "full_name",
        employee.full_name
    )

    employee.email = data.get(
        "email",
        employee.email
    )

    employee.phone = data.get(
        "phone",
        employee.phone
    )

    employee.employee_code = data.get(
        "employee_code",
        employee.employee_code
    )

    employee.department_id = data.get(
        "department_id",
        employee.department_id
    )

    employee.designation_id = data.get(
        "designation_id",
        employee.designation_id
    )

    employee.role = data.get(
        "role",
        employee.role
    )

    employee.shift_id = data.get(
        "shift_id",
        employee.shift_id
    )

    employee.basic_salary = data.get(
        "basic_salary",
        employee.basic_salary
    )

    employee.branch_id = data.get(
        "branch_id",
        employee.branch_id
    )

    if data.get("joining_date"):

        try:

            employee.joining_date = datetime.strptime(
                data["joining_date"],
                "%Y-%m-%d"
            ).date()

        except ValueError:

            employee.joining_date = datetime.strptime(
                data["joining_date"],
                "%a, %d %b %Y %H:%M:%S GMT"
            ).date()

    employee.status = data.get(
        "status",
        employee.status
    )

    employee.leave_balance = data.get(
        "leave_balance",
        employee.leave_balance
    )

    if data.get("password") and data["password"].strip():

        employee.password_hash = hash_password(
            data["password"]
        )

    try:

        db.session.commit()

        return jsonify({
            "message": "Employee updated successfully"
        })

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "message": "Failed to update employee",
            "error": str(e)
        }), 500


# =========================================================
# DEACTIVATE EMPLOYEE
# =========================================================

@employee_bp.route(
    "/api/employees/<int:id>/deactivate",
    methods=["PUT"]
)
def deactivate_employee(id):

    denied = require_management_access()

    if denied:
        return denied

    employee = Employee.query.get_or_404(id)

    employee.status = "inactive"

    db.session.commit()

    return jsonify({
        "message": "Employee deactivated successfully"
    })


# =========================================================
# CHANGE PASSWORD
# =========================================================

@employee_bp.route(
    "/api/employees/<int:id>/password",
    methods=["PUT"]
)
def change_password(id):

    verify_jwt_in_request()

    claims = get_jwt()

    role = str(
        claims.get("role", "")
    ).strip().lower()

    current_employee_id = get_current_employee_id()

    # -----------------------------------------------------
    # HR / SUPER ADMIN
    # Can change employee passwords.
    # -----------------------------------------------------

    if role in [
        "super admin",
        "admin",
        "super_admin",
        "hr",
        "hr admin",
        "hr_admin"
    ]:
        employee = Employee.query.get_or_404(id)

    # -----------------------------------------------------
    # EMPLOYEE
    # Can change only their own password.
    # -----------------------------------------------------

    elif role == "employee":

        if current_employee_id != id:
            return jsonify({
                "message": (
                    "Access denied. "
                    "You can only change your own password."
                )
            }), 403

        employee = Employee.query.get_or_404(id)

    else:

        return jsonify({
            "message": "Access denied."
        }), 403

    data = request.get_json() or {}

    current_password = data.get(
        "current_password"
    )

    new_password = data.get(
        "new_password"
    )

    if not current_password or not new_password:

        return jsonify({
            "message": (
                "Current password and new password "
                "are required."
            )
        }), 400

    if len(new_password) < 8:

        return jsonify({
            "message": (
                "New password must be at least "
                "8 characters long."
            )
        }), 400

    if not verify_password(
        current_password,
        employee.password_hash
    ):

        return jsonify({
            "message": "Current password is incorrect"
        }), 400

    employee.password_hash = hash_password(
        new_password
    )

    db.session.commit()

    return jsonify({
        "message": "Password updated successfully"
    })


# =========================================================
# UPLOAD PROFILE PHOTO
# =========================================================

@employee_bp.route(
    "/api/employees/<int:id>/photo",
    methods=["POST"]
)
def upload_photo(id):

    verify_jwt_in_request()

    claims = get_jwt()

    role = str(
        claims.get("role", "")
    ).strip().lower()

    current_employee_id = get_current_employee_id()

    # Management can upload for any employee.
    # Employee can upload only their own photo.

    if role in [
        "super admin",
        "admin",
        "super_admin",
        "hr",
        "hr admin",
        "hr_admin"
    ]:
        pass

    elif role == "employee":

        if current_employee_id != id:
            return jsonify({
                "message": (
                    "Access denied. "
                    "You can only update your own photo."
                )
            }), 403

    else:

        return jsonify({
            "message": "Access denied."
        }), 403

    employee = Employee.query.get_or_404(id)

    if "photo" not in request.files:

        return jsonify({
            "message": "No file uploaded"
        }), 400

    file = request.files["photo"]

    if file.filename == "":

        return jsonify({
            "message": "No file selected"
        }), 400

    filename = secure_filename(
        f"{employee.employee_id}_{file.filename}"
    )

    upload_folder = os.path.join(
        "uploads",
        "profile_photos"
    )

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    filepath = os.path.join(
        upload_folder,
        filename
    )

    file.save(filepath)

    employee.employee_photo = filepath

    db.session.commit()

    return jsonify({
        "message": "Photo uploaded successfully",
        "photo": filepath
    })


# =========================================================
# SERVE PROFILE PHOTO
# =========================================================

@employee_bp.route(
    "/uploads/profile_photos/<filename>"
)
def serve_profile_photo(filename):

    upload_folder = os.path.join(
        os.getcwd(),
        "uploads",
        "profile_photos"
    )

    return send_from_directory(
        upload_folder,
        filename
    )