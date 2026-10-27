from io import BytesIO
from urllib.parse import urlencode

from flask import Blueprint, current_app, jsonify, request, send_file
from flask_jwt_extended import create_access_token
import qrcode

from app import db
from app.models.designation import Designation
from app.models.employee import Employee
from app.services.gps_service import (
    is_employee_geofence_bypassed,
    verify_employee_location,
)
from app.services.location_challenge_service import (
    APPROVED,
    COMPLETED,
    FAILED,
    PENDING,
    create_location_challenge,
    get_location_challenge,
    utcnow,
)
from app.utils.security import verify_password


auth_bp = Blueprint(
    "auth_bp",
    __name__,
)


def normalize_role(employee_role):
    if employee_role in [
        "hr",
        "hr admin",
        "hr_admin",
    ]:
        return "HR"

    if employee_role in [
        "super admin",
        "admin",
        "super_admin",
    ]:
        return "Super Admin"

    return "Employee"


def validate_login_request(data):
    employee_code = str(
        data.get("employee_id", "")
    ).strip()
    password = data.get("password")
    portal = str(
        data.get("role", "")
    ).strip().lower()

    employee = Employee.query.filter_by(
        employee_code=employee_code
    ).first()

    if not employee:
        return None, None, {
            "success": False,
            "message": "Invalid Employee ID",
        }, 401

    if not verify_password(
        password,
        employee.password_hash,
    ):
        return None, None, {
            "success": False,
            "message": "Invalid Password",
        }, 401

    if str(employee.status).strip().lower() != "active":
        return None, None, {
            "success": False,
            "message": (
                "Your account is inactive. "
                "Please contact the administrator."
            ),
        }, 403

    employee_role = str(
        employee.role
    ).strip().lower()

    if employee_role in [
        "super admin",
        "super_admin",
        "admin",
    ]:
        pass

    elif portal == "hr" and employee_role not in [
        "hr",
        "hr admin",
        "hr_admin",
    ]:
        return None, None, {
            "success": False,
            "message": (
                "Only HR can log in through "
                "the HR portal."
            ),
        }, 403

    elif portal == "employee" and employee_role != "employee":
        return None, None, {
            "success": False,
            "message": (
                "Only Employees can log in through "
                "the Employee portal."
            ),
        }, 403

    elif portal not in [
        "admin",
        "hr",
        "employee",
    ]:
        return None, None, {
            "success": False,
            "message": "Invalid login portal.",
        }, 400

    return employee, normalize_role(employee_role), None, None


def build_login_response(
    employee,
    normalized_role,
    location_challenge_id=None,
):
    claims = {
        "role": normalized_role,
    }

    if location_challenge_id:
        claims["location_challenge_id"] = (
            location_challenge_id
        )

    access_token = create_access_token(
        identity=str(employee.employee_id),
        additional_claims=claims,
    )

    designation = None

    if employee.designation_id:
        designation = Designation.query.get(
            employee.designation_id
        )

    return {
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
        "employee_photo": employee.employee_photo,
        "mobile_location_verified": bool(
            location_challenge_id
        ),
    }


def geofence_rejection(gps_result):
    response = {
        "success": False,
        **gps_result,
    }

    if gps_result.get("retry_required"):
        response["mobile_verification_available"] = True

    return jsonify(response), (
        422
        if gps_result.get("retry_required")
        else 403
    )


def challenge_error_response(error):
    if error == "expired":
        return jsonify({
            "success": False,
            "message": "This phone verification request has expired.",
        }), 410

    if error == "not_found":
        return jsonify({
            "success": False,
            "message": "Verification request not found.",
        }), 404

    return jsonify({
        "success": False,
        "message": "This verification request is no longer available.",
    }), 409


def public_app_url():
    configured_url = current_app.config.get(
        "PUBLIC_APP_URL",
        "",
    )

    if configured_url:
        return configured_url.rstrip("/")

    return request.url_root.rstrip("/")


def mobile_verification_url(challenge_id, token):
    query = urlencode({"token": token})

    return (
        f"{public_app_url()}"
        f"/mobile-location-verification/{challenge_id}?{query}"
    )


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    employee, normalized_role, error, status = (
        validate_login_request(data)
    )

    if error:
        return jsonify(error), status

    gps_result = verify_employee_location(
        employee_id=employee.employee_id,
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        accuracy=data.get("accuracy"),
    )

    if not gps_result["allowed"]:
        return geofence_rejection(gps_result)

    return jsonify(
        build_login_response(
            employee,
            normalized_role,
        )
    ), 200


@auth_bp.route(
    "/api/auth/location-challenges",
    methods=["POST"],
)
def start_location_challenge():
    data = request.get_json() or {}

    employee, _, error, status = validate_login_request(data)

    if error:
        return jsonify(error), status

    if is_employee_geofence_bypassed(employee):
        return jsonify({
            "success": False,
            "message": (
                "This account does not require phone location "
                "verification."
            ),
        }), 409

    challenge, token, challenge_error = (
        create_location_challenge(employee)
    )

    if challenge_error == "rate_limited":
        return jsonify({
            "success": False,
            "message": (
                "Too many verification requests. Please wait "
                "before trying again."
            ),
        }), 429

    verification_url = mobile_verification_url(
        challenge.challenge_id,
        token,
    )

    return jsonify({
        "success": True,
        "challenge_id": challenge.challenge_id,
        "challenge_token": token,
        "expires_at": challenge.expires_at.isoformat(),
        "expires_in_seconds": current_app.config.get(
            "LOCATION_CHALLENGE_TTL_SECONDS",
            120,
        ),
        "verification_url": verification_url,
        "qr_url": (
            f"/api/auth/location-challenges/"
            f"{challenge.challenge_id}/qr?"
            f"{urlencode({'token': token})}"
        ),
    }), 201


@auth_bp.route(
    "/api/auth/location-challenges/<string:challenge_id>/qr",
    methods=["GET"],
)
def location_challenge_qr(challenge_id):
    token = request.args.get("token", "")
    challenge, error = get_location_challenge(
        challenge_id,
        token,
        statuses={PENDING},
    )

    if error:
        return challenge_error_response(error)

    image = qrcode.make(
        mobile_verification_url(
            challenge.challenge_id,
            token,
        )
    )
    output = BytesIO()
    image.save(output, format="PNG")
    output.seek(0)

    response = send_file(
        output,
        mimetype="image/png",
        max_age=0,
    )
    response.headers["Cache-Control"] = "no-store"

    return response


@auth_bp.route(
    "/api/auth/location-challenges/<string:challenge_id>/status",
    methods=["GET"],
)
def location_challenge_status(challenge_id):
    token = request.args.get("token", "")
    challenge, error = get_location_challenge(
        challenge_id,
        token,
        statuses={PENDING, APPROVED, COMPLETED},
    )

    if error:
        return challenge_error_response(error)

    return jsonify({
        "success": True,
        "status": challenge.status,
        "expires_at": challenge.expires_at.isoformat(),
    }), 200


@auth_bp.route(
    "/api/auth/location-challenges/<string:challenge_id>/approve",
    methods=["POST"],
)
def approve_location_challenge(challenge_id):
    data = request.get_json() or {}
    challenge, error = get_location_challenge(
    challenge_id,
    data.get("token", ""),
    statuses={PENDING},
    lock=True,
)

    if error:
        db.session.rollback()
        return challenge_error_response(error)

    challenge.attempt_count += 1
    max_attempts = current_app.config.get(
        "LOCATION_CHALLENGE_MAX_ATTEMPTS",
        5,
    )

    if challenge.attempt_count > max_attempts:
        challenge.status = FAILED
        db.session.commit()

        return jsonify({
            "success": False,
            "message": (
                "Too many verification attempts. Generate a new QR "
                "code on the laptop."
            ),
        }), 429

    employee = db.session.get(
        Employee,
        challenge.employee_id,
    )
    employee_code = str(
        data.get("employee_id", "")
    ).strip()

    if (
        not employee
        or employee.employee_code.lower()
        != employee_code.lower()
        or not verify_password(
            data.get("password"),
            employee.password_hash,
        )
        or str(employee.status).strip().lower()
        != "active"
    ):
        db.session.commit()

        return jsonify({
            "success": False,
            "message": "Unable to verify this employee account.",
        }), 401

    gps_result = verify_employee_location(
        employee_id=employee.employee_id,
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        accuracy=data.get("accuracy"),
    )

    if not gps_result["allowed"]:
        db.session.commit()
        return geofence_rejection(gps_result)

    challenge.status = APPROVED
    challenge.approved_at = utcnow()
    challenge.branch_id = gps_result.get("branch_id")
    challenge.latitude = float(data["latitude"])
    challenge.longitude = float(data["longitude"])
    challenge.accuracy = float(data["accuracy"])
    challenge.distance = gps_result.get("distance")
    challenge.allowed_radius = gps_result.get(
        "allowed_radius"
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message": (
            "Location verified. Return to the laptop to finish "
            "sign-in."
        ),
    }), 200


@auth_bp.route(
    "/api/auth/location-challenges/<string:challenge_id>/complete",
    methods=["POST"],
)
def complete_location_challenge(challenge_id):
    data = request.get_json() or {}
    challenge, error = get_location_challenge(
    challenge_id,
    data.get("token", ""),
    statuses={APPROVED},
    lock=True,
)

    if error:
        db.session.rollback()
        return challenge_error_response(error)

    employee = db.session.get(
        Employee,
        challenge.employee_id,
    )

    if (
        not employee
        or str(employee.status).strip().lower()
        != "active"
    ):
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "This employee account is no longer active.",
        }), 403

    challenge.status = COMPLETED
    challenge.completed_at = utcnow()
    db.session.commit()

    return jsonify(
        build_login_response(
            employee,
            normalize_role(
                str(employee.role).strip().lower()
            ),
            location_challenge_id=challenge.challenge_id,
        )
    ), 200
