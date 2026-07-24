from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from app import db
from app.models.employee import Employee
from app.utils.security import (hash_password,verify_password)
from flask import send_from_directory
from datetime import datetime
from app.utils.employee_serializer import serialize_employee




employee_bp = Blueprint(
    "employee_bp",
    __name__
)


@employee_bp.route("/api/employees", methods=["POST"])
def create_employee():

    data = request.get_json()

    # Check duplicate employee code
    if Employee.query.filter_by(employee_code=data["employee_code"]).first():
        return jsonify({
            "message": "Employee code already exists"
        }), 409

    # Check duplicate email
    if Employee.query.filter_by(email=data["email"]).first():
        return jsonify({
            "message": "Email already exists"
        }), 409

    employee = Employee(
        employee_code=data["employee_code"],
        full_name=data["full_name"],
        email=data["email"],
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

        role=data.get("role", "Employee"),
        status=data.get("status", "active"),
        basic_salary=data.get("basic_salary", 0),
        leave_balance=data.get("leave_balance", 12),
        
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

@employee_bp.route("/api/employees", methods=["GET"])
def get_employees():

    employees = Employee.query.all()

    return jsonify([
        serialize_employee(emp)
        for emp in employees
    ])

@employee_bp.route("/api/employees/<int:id>", methods=["PUT"])
def update_employee(id):

    employee = Employee.query.get_or_404(id)

    data = request.get_json()

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

    if data.get("password"):
        employee.password_hash = hash_password(
        data["password"]
)


    if data.get("password") and data["password"].strip():
        employee.password_hash = hash_password(data["password"])

    db.session.commit()

    return jsonify({
        "message": "Employee updated successfully"
    })

@employee_bp.route("/api/employees/<int:id>/deactivate", methods=["PUT"])
def deactivate_employee(id):

    employee = Employee.query.get_or_404(id)

    employee.status = "inactive"

    db.session.commit()

    return jsonify({
        "message": "Employee deactivated successfully"
    })

@employee_bp.route(
    "/api/employees/<int:id>/password",
    methods=["PUT"]
)

def change_password(id):

    employee = Employee.query.get_or_404(id)

    data = request.get_json()

    current_password = data.get(
        "current_password"
    )

    new_password = data.get(
        "new_password"
    )

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

@employee_bp.route(
    "/api/employees/<int:id>/photo",
    methods=["POST"]
)
def upload_photo(id):

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