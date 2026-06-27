from flask import Blueprint, request, jsonify

from app import db
from app.models.shift import Shift
from app.models.employee import Employee
from sqlalchemy import text

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
    })

@shift_bp.route("/api/shifts/<int:id>", methods=["PUT"])
def update_shift(id):

    shift = Shift.query.get_or_404(id)

    data = request.get_json()

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
        "message": "Shift updated successfully"
    })


from sqlalchemy import text

@shift_bp.route("/api/debug-db")
def debug_db():

    rows = db.session.execute(text("""
        SELECT employee_id, employee_code, shift_id
        FROM employees
        ORDER BY employee_id
    """)).fetchall()

    return jsonify([
        {
            "employee_id": r.employee_id,
            "employee_code": r.employee_code,
            "shift_id": r.shift_id,
        }
        for r in rows
    ])