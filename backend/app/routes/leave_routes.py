from flask import Blueprint, request, jsonify

from app import db
from app.models.leave_request import LeaveRequest
from app.models.employee import Employee

leave_bp = Blueprint(
    "leave_bp",
    __name__
)

@leave_bp.route("/api/leaves/apply", methods=["POST"])
def apply_leave():

    data = request.get_json()

    leave = LeaveRequest(
        employee_id=data["employee_id"],
        leave_type=data["leave_type"],
        start_date=data["start_date"],
        end_date=data["end_date"],
        reason=data["reason"]
    )

    db.session.add(leave)
    db.session.commit()

    return jsonify({
        "message": "Leave request submitted"
    }), 201

@leave_bp.route("/api/leaves", methods=["GET"])
def get_all_leaves():

    leaves = LeaveRequest.query.all()

    result = []

    for leave in leaves:
        result.append({
            "leave_id": leave.leave_id,
            "employee_id": leave.employee_id,
            "leave_type": leave.leave_type,
            "start_date": str(leave.start_date),
            "end_date": str(leave.end_date),
            "reason": leave.reason,
            "status": leave.status
        })

    return jsonify(result)

@leave_bp.route("/api/leaves/<int:id>/approve", methods=["PUT"])
def approve_leave(id):

    leave = LeaveRequest.query.get_or_404(id)

    employee = Employee.query.get(
        leave.employee_id
    )

    leave.status = "Approved"

    employee.leave_balance -= 1

    db.session.commit()

    return jsonify({
        "message": "Leave approved"
    })

@leave_bp.route("/api/leaves/<int:id>/reject", methods=["PUT"])
def reject_leave(id):

    leave = LeaveRequest.query.get_or_404(id)

    leave.status = "Rejected"

    db.session.commit()

    return jsonify({
        "message": "Leave rejected"
    })