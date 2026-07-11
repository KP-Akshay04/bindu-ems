from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from app import db
from app.models.employee import Employee
from app.utils.security import hash_password
from app.utils.security import (hash_password,verify_password)
from flask import send_from_directory
from app.models.shift import Shift
from app.models.department import Department
from app.models.branch import Branch
from datetime import datetime

employee_bp = Blueprint(
    "employee_bp",
    __name__
)


@employee_bp.route("/api/employees", methods=["POST"])
def create_employee():

    data = request.get_json()

    employee = Employee(
        employee_code=data["employee_code"],
        full_name=data["full_name"],
        email=data["email"],
        phone=data.get("phone"),

        password_hash=hash_password(
            data["password"]
        ),

        branch_id=data.get("branch_id"),
        department_id=data.get("department_id"),
        shift_id=data.get("shift_id"),

        designation=data.get("designation"),
        role=data.get("role", "Employee"),
        basic_salary=data.get("basic_salary", 0),
        
    )

    db.session.add(employee)
    db.session.commit()

    return jsonify({
        "message": "Employee created successfully"
    }), 201

@employee_bp.route("/api/employees", methods=["GET"])
def get_employees():

    employees = Employee.query.all()

    result = []

    for emp in employees:

        shift = None

        if emp.shift_id:
            shift = Shift.query.get(emp.shift_id)

        department = None
        branch = None

        if emp.department_id:
            department = Department.query.get(emp.department_id)

        if emp.branch_id:
            branch = Branch.query.get(emp.branch_id)

        result.append({
            "employee_id": emp.employee_id,
            "employee_code": emp.employee_code,
            "employee_photo": emp.employee_photo,
            "full_name": emp.full_name,
            "email": emp.email,
            "phone": emp.phone,

            "branch_id": emp.branch_id,
            "branch_name": branch.branch_name if branch else None,

            "department_id": emp.department_id,
            "department_name": department.department_name if department else None,

            "joining_date": str(emp.joining_date) if emp.joining_date else None,

            "shift_id": emp.shift_id,
            "shift_name": shift.shift_name if shift else None,
            "shift_start": str(shift.start_time) if shift else None,
            "shift_end": str(shift.end_time) if shift else None,
            "grace_minutes": shift.grace_minutes if shift else None,

            "designation": emp.designation,
            "role": emp.role,
            "basic_salary": emp.basic_salary,
            "leave_balance": emp.leave_balance,
            "status": emp.status,
        })

    return jsonify(result)

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
    
    employee.designation = data.get(
        "designation",
        employee.designation
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