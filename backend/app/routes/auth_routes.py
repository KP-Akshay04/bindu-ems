from math import radians, sin, cos, sqrt, atan2

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app.models.employee import Employee
from app.models.designation import Designation
from app.models.branch import Branch
from app.utils.security import verify_password


auth_bp = Blueprint(
    "auth_bp",
    __name__
)


def calculate_distance_meters(
    latitude_1,
    longitude_1,
    latitude_2,
    longitude_2
):
    """
    Calculate the distance between two GPS coordinates
    using the Haversine formula.
    """

    earth_radius_meters = 6371000

    lat1 = radians(latitude_1)
    lon1 = radians(longitude_1)

    lat2 = radians(latitude_2)
    lon2 = radians(longitude_2)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(delta_lon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    return earth_radius_meters * c


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    employee_code = str(
        data.get("employee_id", "")
    ).strip()

    password = data.get("password")

    portal = str(
        data.get("role", "")
    ).strip().lower()

    latitude = data.get("latitude")
    longitude = data.get("longitude")

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

    if str(employee.status).strip().lower() != "active":
        return jsonify({
            "success": False,
            "message": (
                "Your account is inactive. "
                "Please contact the administrator."
            )
        }), 403

    employee_role = str(
        employee.role
    ).strip().lower()

    # ---------------------------------------------------------
    # PORTAL / ROLE VALIDATION
    # ---------------------------------------------------------

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
            "message": (
                "Only HR can log in through "
                "the HR portal."
            )
        }), 403

    elif portal == "employee" and employee_role != "employee":
        return jsonify({
            "success": False,
            "message": (
                "Only Employees can log in through "
                "the Employee portal."
            )
        }), 403

    elif portal not in [
        "admin",
        "hr",
        "employee"
    ]:
        return jsonify({
            "success": False,
            "message": "Invalid login portal."
        }), 400

    # ---------------------------------------------------------
    # EMPLOYEE GPS LOGIN VALIDATION
    # ---------------------------------------------------------

    if (
        employee_role == "employee"
        and employee.employee_code != "EMP003"
    ):

        # Employee must have an assigned branch.
        if not employee.branch_id:
            return jsonify({
                "success": False,
                "message": (
                    "No branch is assigned to your account. "
                    "Please contact the administrator."
                )
            }), 403

        # GPS coordinates are mandatory for employee login.
        if latitude is None or longitude is None:
            return jsonify({
                "success": False,
                "message": (
                    "Your location is required to log in. "
                    "Please allow location access and try again."
                )
            }), 403

        # Convert and validate GPS values.
        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": (
                    "Invalid location coordinates."
                )
            }), 400

        if not (
            -90 <= latitude <= 90
            and -180 <= longitude <= 180
        ):
            return jsonify({
                "success": False,
                "message": (
                    "Invalid location coordinates."
                )
            }), 400

        branch = Branch.query.get(
            employee.branch_id
        )

        if not branch:
            return jsonify({
                "success": False,
                "message": (
                    "Your assigned branch could not "
                    "be found. Please contact the administrator."
                )
            }), 403

        # Branch must have configured GPS coordinates.
        if (
            branch.latitude is None
            or branch.longitude is None
        ):
            return jsonify({
                "success": False,
                "message": (
                    "Your assigned branch does not have "
                    "location coordinates configured."
                )
            }), 403

        allowed_radius = (
            branch.allowed_radius
            if branch.allowed_radius is not None
            else 100
        )

        try:
            allowed_radius = float(
                allowed_radius
            )
        except (TypeError, ValueError):
            allowed_radius = 100

        distance = calculate_distance_meters(
            latitude,
            longitude,
            float(branch.latitude),
            float(branch.longitude)
        )

        if distance > allowed_radius:
            return jsonify({
                "success": False,
                "message": (
                    "You are outside your assigned "
                    "branch location. Login is not allowed."
                )
            }), 403

    # ---------------------------------------------------------
    # CREATE JWT
    # ---------------------------------------------------------

    if employee_role in [
        "hr",
        "hr admin",
        "hr_admin"
    ]:
        normalized_role = "HR"

    elif employee_role in [
        "super admin",
        "admin",
        "super_admin"
    ]:
        normalized_role = "Super Admin"

    else:
        normalized_role = "Employee"

    access_token = create_access_token(
        identity=str(employee.employee_id),
        additional_claims={
            "role": normalized_role
        }
    )

    # ---------------------------------------------------------
    # DESIGNATION
    # ---------------------------------------------------------

    designation = None

    if employee.designation_id:
        designation = Designation.query.get(
            employee.designation_id
        )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return jsonify({
        "success": True,

        "access_token": access_token,

        "employee_id": employee.employee_id,
        "employee_code": employee.employee_code,

        "full_name": employee.full_name,
        "email": employee.email,
        "phone": employee.phone,

        "branch_id": employee.branch_id,
        "department_id": employee.department_id,
        "designation_id": employee.designation_id,

        "designation_name": (
            designation.designation_name
            if designation
            else None
        ),

        "joining_date": (
            str(employee.joining_date)
            if employee.joining_date
            else None
        ),

        "role": normalized_role,

        "status": employee.status,
        "employee_photo": employee.employee_photo
    }), 200