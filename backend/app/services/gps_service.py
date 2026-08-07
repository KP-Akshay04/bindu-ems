from flask import current_app

from app.models.employee import Employee
from app.models.branch import Branch
from app.utils.gps import calculate_distance


def verify_employee_location(
    employee_id,
    latitude,
    longitude,
):
    """
    Verify whether an employee is within
    the allowed GPS radius of their
    assigned branch.
    """

    # ==========================================
    # DEVELOPMENT MODE
    # ==========================================
    if (
        current_app.config.get("DEVELOPMENT_MODE")
        and current_app.config.get("SKIP_GPS_VERIFICATION")
    ):
        print("DEVELOPMENT MODE =", current_app.config.get("DEVELOPMENT_MODE"))
        print("SKIP GPS =", current_app.config.get("SKIP_GPS_VERIFICATION"))
    
        
    return {
            "allowed": True,
            "distance": 0,
            "allowed_radius": 0,
            "branch_name": "Development Mode",
            "branch_id": None,
            "message": "GPS verification skipped (Development Mode)."
        }

    employee = Employee.query.get(employee_id)

    if not employee:
        return {
            "allowed": False,
            "message": "Employee not found."
        }

    if not employee.branch_id:
        return {
            "allowed": False,
            "message": "Employee is not assigned to any branch."
        }

    branch = Branch.query.get(employee.branch_id)

    if not branch:
        return {
            "allowed": False,
            "message": "Assigned branch not found."
        }

    if (
        branch.latitude is None or
        branch.longitude is None
    ):
        return {
            "allowed": False,
            "message": "Branch GPS location is not configured."
        }

    distance = calculate_distance(
        latitude,
        longitude,
        branch.latitude,
        branch.longitude,
    )

    allowed = distance <= branch.allowed_radius

    return {
        "allowed": allowed,
        "distance": round(distance, 2),
        "allowed_radius": branch.allowed_radius,
        "branch_name": branch.branch_name,
        "branch_id": branch.branch_id,
        "message": (
            "GPS verification successful."
            if allowed
            else "You are outside your assigned branch."
        )
    }