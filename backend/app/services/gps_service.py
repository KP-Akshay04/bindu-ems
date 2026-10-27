from math import isfinite

from flask import current_app

from app.models.employee import Employee
from app.models.branch import Branch
from app.utils.gps import calculate_distance


def is_employee_geofence_bypassed(employee):
    employee_code = str(
        employee.employee_code or ""
    ).strip().upper()

    bypassed_codes = current_app.config.get(
        "GEOFENCE_BYPASS_EMPLOYEE_CODES",
        set(),
    )

    return employee_code in bypassed_codes


def verify_employee_location(
    employee_id,
    latitude,
    longitude,
    accuracy,
):
    """
    Verify whether an employee is within
    the allowed GPS radius of their
    assigned branch.
    """

    employee = Employee.query.get(employee_id)

    if not employee:
        return {
            "allowed": False,
            "message": "Employee not found."
        }

    if is_employee_geofence_bypassed(employee):
        return {
            "allowed": True,
            "geofence_bypassed": True,
            "branch_name": "Geofence Bypassed",
            "branch_id": employee.branch_id,
            "distance": None,
            "allowed_radius": None,
            "message": "Geofence verification bypassed for this account."
        }

    try:
        latitude = float(latitude)
        longitude = float(longitude)
        accuracy = float(accuracy)
    except (TypeError, ValueError):
        return {
            "allowed": False,
            "retry_required": True,
            "message": "Unable to verify location accuracy. Please retry."
        }

    if (
        not isfinite(latitude)
        or not isfinite(longitude)
        or not isfinite(accuracy)
        or accuracy < 0
        or not (-90 <= latitude <= 90)
        or not (-180 <= longitude <= 180)
    ):
        return {
            "allowed": False,
            "retry_required": True,
            "message": "Invalid location fix. Please retry."
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

    allowed_radius = (
        100
        if branch.allowed_radius is None
        else branch.allowed_radius
    )

    try:
        allowed_radius = float(allowed_radius)
        branch_latitude = float(branch.latitude)
        branch_longitude = float(branch.longitude)
    except (TypeError, ValueError):
        return {
            "allowed": False,
            "message": "Branch geofence settings are invalid."
        }

    if (
        not isfinite(allowed_radius)
        or allowed_radius <= 0
        or not isfinite(branch_latitude)
        or not isfinite(branch_longitude)
        or not (-90 <= branch_latitude <= 90)
        or not (-180 <= branch_longitude <= 180)
    ):
        return {
            "allowed": False,
            "message": "Branch geofence settings are invalid."
        }

    max_accuracy = float(current_app.config.get(
        "GEOFENCE_MAX_ACCURACY_METERS",
        50,
    ))
    max_accuracy = min(max_accuracy, allowed_radius)

    if accuracy > max_accuracy:
        return {
            "allowed": False,
            "accuracy": round(accuracy, 2),
            "max_accuracy": max_accuracy,
            "allowed_radius": allowed_radius,
            "branch_name": branch.branch_name,
            "branch_id": branch.branch_id,
            "retry_required": True,
            "message": (
                f"GPS accuracy is ±{round(accuracy)} m; "
                f"a reading within ±{round(max_accuracy)} m is required. "
                "Use a phone or improve the laptop's location signal and retry."
            )
        }

    distance = calculate_distance(
        latitude,
        longitude,
        branch_latitude,
        branch_longitude,
    )

    confidently_inside = distance + accuracy <= allowed_radius
    confidently_outside = distance - accuracy > allowed_radius
    retry_required = not confidently_inside and not confidently_outside
    allowed = confidently_inside

    if retry_required:
        message = "Your location is too close to the geofence boundary to verify. Please retry for a more accurate GPS fix."
    elif allowed:
        message = "GPS verification successful."
    else:
        message = "You are outside your assigned branch."

    return {
        "allowed": allowed,
        "distance": round(distance, 2),
        "accuracy": round(accuracy, 2),
        "allowed_radius": allowed_radius,
        "branch_name": branch.branch_name,
        "branch_id": branch.branch_id,
        "retry_required": retry_required,
        "message": message
    }
