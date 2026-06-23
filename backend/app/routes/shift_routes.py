from flask import Blueprint, request, jsonify

from app import db
from app.models.shift import Shift

shift_bp = Blueprint(
    "shift_bp",
    __name__
)


@shift_bp.route("/api/shifts", methods=["GET"])
def get_shifts():

    shifts = Shift.query.all()

    result = []

    for shift in shifts:
        result.append({
            "shift_id": shift.shift_id,
            "shift_name": shift.shift_name,
            "start_time": str(shift.start_time),
            "end_time": str(shift.end_time),
            "grace_minutes": shift.grace_minutes
        })

    return jsonify(result)


@shift_bp.route("/api/shifts", methods=["POST"])
def create_shift():

    data = request.get_json()

    shift = Shift(
        shift_name=data["shift_name"],
        start_time=data["start_time"],
        end_time=data["end_time"],
        grace_minutes=data.get("grace_minutes", 15)
    )

    db.session.add(shift)
    db.session.commit()

    return jsonify({
        "message": "Shift created successfully"
    }), 201