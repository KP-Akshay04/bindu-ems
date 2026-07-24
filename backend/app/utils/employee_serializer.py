from app.models.department import Department
from app.models.branch import Branch
from app.models.designation import Designation
from app.models.shift import Shift


def serialize_employee(employee):
    if not employee:
        return {}

    department = (
        Department.query.get(employee.department_id)
        if employee.department_id else None
    )

    branch = (
        Branch.query.get(employee.branch_id)
        if employee.branch_id else None
    )

    designation = (
        Designation.query.get(employee.designation_id)
        if employee.designation_id else None
    )

    shift = (
        Shift.query.get(employee.shift_id)
        if employee.shift_id else None
    )

    return {
        "employee_id": employee.employee_id,
        "employee_code": employee.employee_code,
        "employee_name": employee.full_name,
        "full_name": employee.full_name,

        "email": employee.email,
        "phone": employee.phone,

        "employee_photo": employee.employee_photo,

        "department_id": employee.department_id,
        "department_name": (
            department.department_name if department else None
        ),

        "designation_id": employee.designation_id,
        "designation_name": (
            designation.designation_name if designation else None
        ),

        "branch_id": employee.branch_id,
        "branch_name": (
            branch.branch_name if branch else None
        ),

        "branch_latitude": (
            branch.latitude if branch else None
        ),
        "branch_longitude": (
            branch.longitude if branch else None
        ),
        "allowed_radius": (
            branch.allowed_radius if branch else None
         ),

        "shift_id": employee.shift_id,
        "shift_name": (
            shift.shift_name if shift else None
        ),

        "joining_date": (
            str(employee.joining_date)
            if employee.joining_date else None
        ),

        "joining_date": (
    str(employee.joining_date)
    if employee.joining_date else None
    ),

    "joining_date_raw": employee.joining_date,

        "role": employee.role,
        "status": employee.status,

        "basic_salary": employee.basic_salary,
        "leave_balance": employee.leave_balance
    }