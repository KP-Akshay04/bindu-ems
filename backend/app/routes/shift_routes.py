from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from app import db
from app.models.shift import Shift
from app.models.employee import Employee
from app.utils.authorization import has_permission


shift_bp = Blueprint(
    "shift_bp",
    __name__
)


# =========================================================
# AUTHORIZATION
# =========================================================

def require_shift_management_access():

    verify_jwt_in_request()

    claims = get_jwt()

    role = str(
        claims.get("role", "")
    ).strip().lower()

    # Super Admin has unrestricted access
    if role == "super admin":
        return True

    # HR requires the Shift Management permission
    if role == "hr":
        return has_permission(
            "hr",
            "hr_shifts"
        )

    return False


def management_access_denied():

    return jsonify({
        "success": False,
        "message":
            "Access denied. Shift management permission is required."
    }), 403


# =========================================================
# GET SHIFTS
# =========================================================

@shift_bp.route(
    "/api/shifts",
    methods=["GET"]
)
def get_shifts():

    if not require_shift_management_access():
        return management_access_denied()

    shifts = Shift.query.all()

    result = []

    for shift in shifts:

        result.append({

            "shift_id":
                shift.shift_id,

            "shift_name":
                shift.shift_name,

            "start_time":
                str(shift.start_time),

            "end_time":
                str(shift.end_time),

            "grace_minutes":
                shift.grace_minutes

        })

    return jsonify(result), 200


# =========================================================
# CREATE SHIFT
# =========================================================

@shift_bp.route(
    "/api/shifts",
    methods=["POST"]
)
def create_shift():

    if not require_shift_management_access():
        return management_access_denied()

    data = request.get_json() or {}

    shift_name = str(
        data.get(
            "shift_name",
            ""
        )
    ).strip()

    start_time = data.get(
        "start_time"
    )

    end_time = data.get(
        "end_time"
    )

    if not shift_name:

        return jsonify({
            "success": False,
            "message": "Shift name is required."
        }), 400

    if not start_time:

        return jsonify({
            "success": False,
            "message": "Start time is required."
        }), 400

    if not end_time:

        return jsonify({
            "success": False,
            "message": "End time is required."
        }), 400

    shift = Shift(

        shift_name=shift_name,

        start_time=start_time,

        end_time=end_time,

        grace_minutes=data.get(
            "grace_minutes",
            15
        )

    )

    db.session.add(
        shift
    )

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Shift created successfully"

    }), 201


# =========================================================
# UPDATE SHIFT
# =========================================================

@shift_bp.route(
    "/api/shifts/<int:id>",
    methods=["PUT"]
)
def update_shift(id):

    if not require_shift_management_access():
        return management_access_denied()

    shift = Shift.query.get_or_404(
        id
    )

    data = request.get_json() or {}

    shift.shift_name = data.get(
        "shift_name",
        shift.shift_name
    )

    shift.start_time = data.get(
        "start_time",
        shift.start_time
    )

    shift.end_time = data.get(
        "end_time",
        shift.end_time
    )

    shift.grace_minutes = data.get(
        "grace_minutes",
        shift.grace_minutes
    )

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Shift updated successfully"

    }), 200


# =========================================================
# DELETE SHIFT
# =========================================================

@shift_bp.route(
    "/api/shifts/<int:id>",
    methods=["DELETE"]
)
def delete_shift(id):

    if not require_shift_management_access():
        return management_access_denied()

    count = Employee.query.filter_by(
        shift_id=id
    ).count()

    if count > 0:

        return jsonify({

            "success": False,

            "message":
                "Shift is assigned to employees."

        }), 400

    shift = Shift.query.get_or_404(
        id
    )

    db.session.delete(
        shift
    )

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Shift deleted successfully"

    }), 200