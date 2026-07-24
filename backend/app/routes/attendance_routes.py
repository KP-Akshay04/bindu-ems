from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta

from app import db
from app.models.attendance import Attendance
from app.models.attendance_log import AttendanceLog
from app.models.employee import Employee
from app.models.shift import Shift





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

    employee = Employee.query.get(employee_id)

    status = "Working"

    if employee and employee.shift_id:

        shift = Shift.query.get(employee.shift_id)

        if shift:

            now = datetime.now().time()

            grace_time = (
                datetime.combine(
                    date.today(),
                    shift.start_time
                ) +
                timedelta(
                    minutes=shift.grace_minutes
                )
            ).time()

            if now > grace_time:
                status = "Late"
            else:
                status = "Present"

    attendance = Attendance(
        employee_id=employee_id,
        attendance_date=date.today(),
        login_time=datetime.now(),
        status=status
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
        "message": "Login recorded successfully",
        "status": status
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
    
    if attendance.logout_time:
        return jsonify({
            "message": "Cannot start lunch after logout."
        }), 400

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
    "attendance": {
        "attendance_id": attendance.attendance_id,
        "employee_id": attendance.employee_id,
        "attendance_date": str(attendance.attendance_date),
        "login_time": str(attendance.login_time) if attendance.login_time else None,
        "logout_time": str(attendance.logout_time) if attendance.logout_time else None,
        "working_seconds": attendance.working_seconds,
        "lunch_seconds": attendance.lunch_seconds,
        "lunch_start_time": str(attendance.lunch_start_time) if attendance.lunch_start_time else None,
        "lunch_end_time": str(attendance.lunch_end_time) if attendance.lunch_end_time else None,
        "status": attendance.status,
    }
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
    
    if attendance.logout_time:
        return jsonify({
            "message": "Cannot return from lunch after logout."
        }), 400

    if not attendance.lunch_start_time:
        return jsonify({
            "message": "Lunch break was not started"
        }), 400

    attendance.lunch_end_time = datetime.now()

    lunch_seconds = int(
    (
        attendance.lunch_end_time -
        attendance.lunch_start_time
    ).total_seconds()
)

    attendance.lunch_seconds = (
        attendance.lunch_seconds or 0
        ) + lunch_seconds

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
        "attendance": {
        "attendance_id": attendance.attendance_id,
        "employee_id": attendance.employee_id,
        "attendance_date": str(attendance.attendance_date),
        "login_time": str(attendance.login_time) if attendance.login_time else None,
        "logout_time": str(attendance.logout_time) if attendance.logout_time else None,
        "working_seconds": attendance.working_seconds,
        "lunch_seconds": attendance.lunch_seconds,
        "lunch_start_time": str(attendance.lunch_start_time) if attendance.lunch_start_time else None,
        "lunch_end_time": str(attendance.lunch_end_time) if attendance.lunch_end_time else None,
        "status": attendance.status,
    }
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

    if attendance.lunch_start_time and not attendance.lunch_end_time:
        attendance.lunch_end_time = datetime.now()

        attendance.lunch_seconds += int(
            (
                attendance.lunch_end_time -
                attendance.lunch_start_time
            ).total_seconds()
    )


    working_seconds = max(
    0,
    int(total_duration.total_seconds()) -
    (attendance.lunch_seconds or 0)
)

    attendance.working_seconds = working_seconds

    employee = Employee.query.get(employee_id)

    if employee and employee.shift_id:

        shift = Shift.query.get(
            employee.shift_id
        )

        if shift:

            logout_time = attendance.logout_time.time()

            if logout_time < shift.end_time:
                attendance.status = "Early Logout"
            else:
                attendance.status = "Completed"

    else:
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
        "working_seconds": attendance.working_seconds,
        "lunch_seconds": attendance.lunch_seconds,
        "status": attendance.status
    })


@attendance_bp.route(
    "/api/attendance/today/<int:employee_id>",
    methods=["GET"]
)
def get_today_attendance(employee_id):


    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()
    
    print("DATABASE URI:", db.engine.url)
    print("TODAY:", date.today())

    print("=== DEBUG ===")
    print("Attendance ID:", attendance.attendance_id if attendance else None)
    print("Attendance Date:", attendance.attendance_date if attendance else None)
    print("Status:", attendance.status if attendance else None)
    print("Login:", attendance.login_time if attendance else None)
    print("Logout:", attendance.logout_time if attendance else None)

    if not attendance:
        return jsonify({
            "logged_in": False,
            "attendance": None
        }), 200

    employee = Employee.query.get(employee_id)

    shift = None

    if employee and employee.shift_id:
        shift = Shift.query.get(employee.shift_id)

    logged_in = (
    attendance is not None and
    attendance.logout_time is None
)

    return jsonify({

    "logged_in": logged_in,

    "attendance": {

        "attendance_id": attendance.attendance_id,

        "employee_id": attendance.employee_id,

        "employee_name":
            employee.full_name if employee else None,

        "employee_code":
            employee.employee_code if employee else None,

        "role":
            employee.role if employee else None,

        "shift_name":
            shift.shift_name if shift else None,

        "attendance_date":
            str(attendance.attendance_date),

        "login_time":
            str(attendance.login_time)
            if attendance.login_time else None,

        "logout_time":
            str(attendance.logout_time)
            if attendance.logout_time else None,

        "working_seconds":
            attendance.working_seconds,

        "lunch_seconds":
            attendance.lunch_seconds,

        "lunch_start_time":
            str(attendance.lunch_start_time)
            if attendance.lunch_start_time else None,

        "lunch_end_time":
            str(attendance.lunch_end_time)
            if attendance.lunch_end_time else None,

        "status":
            attendance.status
    }

})

@attendance_bp.route(
    "/api/attendance",
    methods=["GET"]
)
def get_attendance():

    employee_id = request.args.get("employee_id", type=int)

    query = Attendance.query

    if employee_id:
        query = query.filter(
            Attendance.employee_id == employee_id
        )

    records = query.order_by(
        Attendance.attendance_date.desc(),
        Attendance.login_time.desc()
    ).all()

    attendance = []

    for record in records:

        employee = Employee.query.get(record.employee_id)

        shift = None
        if employee and employee.shift_id:
            shift = Shift.query.get(employee.shift_id)

        attendance.append({
            "attendance_id": record.attendance_id,
            "employee_id": record.employee_id,
            "employee_name": employee.full_name if employee else None,
            "employee_code": employee.employee_code if employee else None,
            "role": employee.role if employee else None,
            "shift_name": shift.shift_name if shift else None,
            "attendance_date": str(record.attendance_date),
            "login_time": str(record.login_time) if record.login_time else None,
            "logout_time": str(record.logout_time) if record.logout_time else None,
            "working_seconds": record.working_seconds,
            "lunch_seconds": record.lunch_seconds,
            "lunch_start_time": str(record.lunch_start_time) if record.lunch_start_time else None,
            "lunch_end_time": str(record.lunch_end_time) if record.lunch_end_time else None,
            "status": record.status,
        })

    return jsonify({
        "attendance": attendance
    })
