from flask import Blueprint, request, jsonify

from app import db
from app.models.attendance import Attendance
from app.models.attendance_log import AttendanceLog
from app.models.employee import Employee
from datetime import datetime, date


attendance_bp = Blueprint(
    "attendance_bp",
    __name__
)


@attendance_bp.route(
    "/api/attendance/login",
    methods=["POST"]
)
def employee_login():

    data = request.get_json()

    employee_id = (
        data
        if isinstance(data, int)
        else data.get("employee_id")
    )

    if not employee_id:
        return jsonify({
            "message": "employee_id is required"
        }), 400

    existing = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if existing:
        return jsonify({
            "message": "Attendance already recorded today",
            "already_logged_in": True
        }), 200

    attendance = Attendance(
        employee_id=employee_id,
        attendance_date=date.today(),
        login_time=datetime.now(),
        status="Working"
    )

    db.session.add(attendance)

    log = AttendanceLog(
        employee_id=employee_id,
        action="LOGIN",
        timestamp=datetime.now()
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({
        "message": "Login recorded successfully"
    })


@attendance_bp.route(
    "/api/attendance/lunch-out",
    methods=["POST"]
)
def lunch_out():

    data = request.get_json()

    employee_id = (
        data
        if isinstance(data, int)
        else data.get("employee_id")
    )

    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if not attendance:
        return jsonify({
            "message": "Attendance record not found"
        }), 404

    if attendance.lunch_end_time:
        return jsonify({
            "message": "Lunch break already used today"
        }), 400

    attendance.status = "Lunch Break"
    attendance.lunch_start_time = datetime.now()
    attendance.lunch_end_time = None

    log = AttendanceLog(
        employee_id=employee_id,
        action="LUNCH_OUT",
        timestamp=datetime.now()
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({
        "message": "Lunch break started",
        "lunch_start_time": str(attendance.lunch_start_time)
    })


@attendance_bp.route(
    "/api/attendance/lunch-in",
    methods=["POST"]
)
def lunch_in():

    data = request.get_json()

    employee_id = (
        data
        if isinstance(data, int)
        else data.get("employee_id")
    )

    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if not attendance:
        return jsonify({
            "message": "Attendance record not found"
        }), 404

    if not attendance.lunch_start_time:
        return jsonify({
            "message": "Lunch break was not started"
        }), 400

    attendance.lunch_end_time = datetime.now()

    lunch_minutes = round(
        (
            attendance.lunch_end_time -
            attendance.lunch_start_time
        ).total_seconds() / 60
    )

    attendance.lunch_minutes = (attendance.lunch_minutes or 0) + lunch_minutes
    attendance.status = "Working"

    log = AttendanceLog(
        employee_id=employee_id,
        action="LUNCH_IN",
        timestamp=datetime.now()
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({
        "message": "Returned from lunch",
        "lunch_minutes": attendance.lunch_minutes,
        "lunch_end_time": str(attendance.lunch_end_time)
    })


@attendance_bp.route(
    "/api/attendance/logout/<int:employee_id>",
    methods=["PUT"]
)
def employee_logout(employee_id):

    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if not attendance:
        return jsonify({
            "message": "Attendance record not found"
        }), 404

    if attendance.logout_time:
        return jsonify({
            "message": "Already logged out"
        }), 400

    attendance.logout_time = datetime.now()

    total_duration = (
        attendance.logout_time -
        attendance.login_time
    )

    working_seconds = (
        total_duration.total_seconds() -
        ((attendance.lunch_minutes or 0) * 60)
    )

    attendance.working_hours = round(
        working_seconds / 3600,
        2
    )

    attendance.status = "Logged Out"

    log = AttendanceLog(
        employee_id=employee_id,
        action="LOGOUT",
        timestamp=datetime.now()
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({
        "message": "Logout recorded successfully",
        "working_hours": attendance.working_hours,
        "lunch_minutes": attendance.lunch_minutes
    })


@attendance_bp.route(
    "/api/attendance",
    methods=["GET"]
)
def get_attendance():

    employee_id = request.args.get(
        "employee_id"
    )

    if employee_id:
        records = Attendance.query.filter_by(
            employee_id=employee_id
        ).all()
    else:
        records = Attendance.query.all()

    result = []

    for record in records:

        employee = Employee.query.get(
            record.employee_id
    )

    result.append({
        "attendance_id": record.attendance_id,
        "employee_id": record.employee_id,

        "employee_name":
            employee.full_name if employee else None,

        "employee_code":
            employee.employee_code if employee else None,

        "role":
            employee.role if employee else None,

        "attendance_date": str(record.attendance_date),
        "login_time": str(record.login_time) if record.login_time else None,
        "logout_time": str(record.logout_time) if record.logout_time else None,
        "working_hours": record.working_hours,
        "lunch_minutes": record.lunch_minutes,

        "lunch_start_time":
            str(record.lunch_start_time)
            if record.lunch_start_time
            else None,

        "lunch_end_time":
            str(record.lunch_end_time)
            if record.lunch_end_time
            else None,

        "status": record.status
    })

    return jsonify(result)