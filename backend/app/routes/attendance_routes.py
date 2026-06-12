from flask import Blueprint, request, jsonify

from app import db
from app.models.attendance import Attendance

from datetime import datetime, date

attendance_bp = Blueprint(
    "attendance_bp",
    __name__
)

@attendance_bp.route("/api/attendance/login", methods=["POST"])
def employee_login():

    data = request.get_json()

    attendance = Attendance(
        employee_id=data["employee_id"],
        attendance_date=date.today(),
        login_time=datetime.now(),
        status="Present"
    )

    db.session.add(attendance)
    db.session.commit()

    return jsonify({
        "message": "Login recorded successfully"
    })

@attendance_bp.route("/api/attendance/logout/<int:employee_id>", methods=["PUT"])
def employee_logout(employee_id):

    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if not attendance:
        return jsonify({
            "message": "Attendance record not found"
        }), 404

    attendance.logout_time = datetime.now()

    duration = (
        attendance.logout_time -
        attendance.login_time
    )

    attendance.working_hours = round(
        duration.total_seconds() / 3600,
        2
    )

    db.session.commit()

    return jsonify({
        "message": "Logout recorded successfully",
        "working_hours": attendance.working_hours
    })

@attendance_bp.route("/api/attendance", methods=["GET"])
def get_attendance():

    records = Attendance.query.all()

    result = []

    for record in records:

        result.append({
            "attendance_id": record.attendance_id,
            "employee_id": record.employee_id,
            "attendance_date": str(record.attendance_date),
            "login_time": str(record.login_time),
            "logout_time": str(record.logout_time),
            "working_hours": record.working_hours,
            "status": record.status
        })

    return jsonify(result)