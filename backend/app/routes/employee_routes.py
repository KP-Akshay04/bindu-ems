from flask import Blueprint, request, jsonify

from app import db
from app.models.employee import Employee
from app.utils.security import hash_password
from app.utils.security import (hash_password,verify_password)

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

        designation=data.get("designation"),
        role=data.get("role", "Employee"),
        basic_salary=data.get("basic_salary", 0)
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

        result.append({
            "employee_id": emp.employee_id,
            "employee_code": emp.employee_code,
            "full_name": emp.full_name,
            "email": emp.email,
            "phone": emp.phone,
            "branch_id": emp.branch_id,
            "department_id": emp.department_id,
            "designation": emp.designation,
            "role": emp.role,
            "basic_salary": emp.basic_salary,
            "leave_balance": emp.leave_balance,
            "status": emp.status
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

    employee.designation = data.get(
        "designation",
        employee.designation
    )

    employee.role = data.get(
    "role",
    employee.role
    )

    employee.basic_salary = data.get(
        "basic_salary",
        employee.basic_salary
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