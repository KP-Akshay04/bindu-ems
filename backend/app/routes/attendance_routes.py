from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, date, timedelta

from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    verify_jwt_in_request,
)

from app import db
from app.models.attendance import Attendance
from app.models.attendance_log import AttendanceLog
from app.models.employee import Employee
from app.models.shift import Shift
from app.models.branch import Branch
from app.models.department import Department
from app.models.designation import Designation
from app.services.gps_service import verify_employee_location
from app.utils.authorization import has_permission


attendance_bp = Blueprint(
    "attendance_bp",
    __name__
)


# ============================================================
# AUTHORIZATION HELPERS
# ============================================================

def get_current_user_context():
    """
    Returns the authenticated employee ID and role
    from the JWT.
    """

    verify_jwt_in_request()

    identity = get_jwt_identity()
    claims = get_jwt()

    role = str(
        claims.get("role", "")
    ).strip()

    return identity, role


def is_super_admin(role):
    return role.lower() in [
        "super admin",
        "super_admin",
        "admin"
    ]


def can_manage_attendance(role):
    """
    Super Admin always has Attendance management access.

    HR requires the database-controlled
    hr_attendance permission.
    """

    if is_super_admin(role):
        return True

    if role.lower() == "hr":
        return has_permission(
            role,
            "hr_attendance"
        )

    return False


def is_same_employee(
    current_employee_id,
    requested_employee_id
):
    return str(current_employee_id) == str(
        requested_employee_id
    )


# ============================================================
# EMPLOYEE CHECK-IN
# ============================================================

@attendance_bp.route(
    "/api/attendance/login",
    methods=["POST"]
)
def employee_login():

    current_employee_id, role = (
        get_current_user_context()
    )

    print(
        "DEVELOPMENT_MODE =",
        current_app.config.get(
            "DEVELOPMENT_MODE"
        )
    )

    data = request.get_json() or {}

    employee_id = (
        data
        if isinstance(data, int)
        else data.get("employee_id")
    )

    latitude = (
        None
        if isinstance(data, int)
        else data.get("latitude")
    )

    longitude = (
        None
        if isinstance(data, int)
        else data.get("longitude")
    )

    if not employee_id:

        return jsonify({
            "success": False,
            "message":
                "employee_id is required."
        }), 400

    # --------------------------------------------------------
    # Users can only create attendance for themselves.
    # --------------------------------------------------------

    if not is_same_employee(
        current_employee_id,
        employee_id
    ):

        return jsonify({
            "success": False,
            "message":
                "Access denied. You can only record your own attendance."
        }), 403

    # --------------------------------------------------------
    # GPS is mandatory
    # --------------------------------------------------------

    if latitude is None or longitude is None:

        return jsonify({
            "success": False,
            "message":
                "Current GPS location is required."
        }), 400

    try:

        latitude = float(latitude)
        longitude = float(longitude)

    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "message":
                "Invalid GPS coordinates."
        }), 400

    if not (-90 <= latitude <= 90):

        return jsonify({
            "success": False,
            "message":
                "Invalid latitude."
        }), 400

    if not (-180 <= longitude <= 180):

        return jsonify({
            "success": False,
            "message":
                "Invalid longitude."
        }), 400

    # --------------------------------------------------------
    # GPS branch validation
    # --------------------------------------------------------

    if current_app.config.get(
        "DEVELOPMENT_MODE",
        False
    ):

        gps_result = {
            "allowed": True,
            "branch_name": "Development Mode",
            "branch_id": None,
            "distance": 0,
            "allowed_radius": 0,
        }

    else:

        gps_result = verify_employee_location(
            employee_id=employee_id,
            latitude=latitude,
            longitude=longitude
        )

        if not gps_result["allowed"]:

            return jsonify(
                gps_result
            ), 403

    # --------------------------------------------------------
    # Prevent duplicate attendance
    # --------------------------------------------------------

    existing = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if existing:

        return jsonify({
            "success": True,
            "message":
                "Attendance already recorded today",
            "already_logged_in": True
        }), 200

    # --------------------------------------------------------
    # Employee / shift
    # --------------------------------------------------------

    employee = Employee.query.get(
        employee_id
    )

    if not employee:

        return jsonify({
            "success": False,
            "message":
                "Employee not found."
        }), 404

    status = "Working"

    if employee.shift_id:

        shift = Shift.query.get(
            employee.shift_id
        )

        if shift:

            now = datetime.now().time()

            grace_time = (
                datetime.combine(
                    date.today(),
                    shift.start_time
                )
                + timedelta(
                    minutes=shift.grace_minutes
                )
            ).time()

            if now > grace_time:
                status = "Late"
            else:
                status = "Present"

    # --------------------------------------------------------
    # Create attendance
    # --------------------------------------------------------

    attendance = Attendance(
        employee_id=employee_id,
        attendance_date=date.today(),
        login_time=datetime.now(),
        status=status
    )

    db.session.add(attendance)

    # --------------------------------------------------------
    # Attendance log
    # --------------------------------------------------------

    log = AttendanceLog(
        employee_id=employee_id,
        action="LOGIN",
        timestamp=datetime.now()
    )

    db.session.add(log)

    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Login recorded successfully",
        "status": status,
        "gps": {
            "branch_name":
                gps_result["branch_name"],

            "branch_id":
                gps_result["branch_id"],

            "distance":
                gps_result["distance"],

            "allowed_radius":
                gps_result["allowed_radius"],
        }
    }), 200


# ============================================================
# LUNCH OUT
# PERSONAL ACTION
# ============================================================

@attendance_bp.route(
    "/api/attendance/lunch-out",
    methods=["POST"]
)
def lunch_out():

    current_employee_id, role = (
        get_current_user_context()
    )

    data = request.get_json() or {}

    employee_id = (
        data
        if isinstance(data, int)
        else data.get("employee_id")
    )

    if not employee_id:

        return jsonify({
            "success": False,
            "message":
                "employee_id is required."
        }), 400

    if not is_same_employee(
        current_employee_id,
        employee_id
    ):

        return jsonify({
            "success": False,
            "message":
                "Access denied. You can only manage your own attendance."
        }), 403

    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if not attendance:

        return jsonify({
            "success": False,
            "message":
                "Attendance record not found"
        }), 404

    if attendance.logout_time:

        return jsonify({
            "success": False,
            "message":
                "Cannot start lunch after logout."
        }), 400

    if attendance.lunch_end_time:

        return jsonify({
            "success": False,
            "message":
                "Lunch break already used today"
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
        "success": True,
        "message":
            "Lunch break started",
        "attendance": {
            "attendance_id":
                attendance.attendance_id,

            "employee_id":
                attendance.employee_id,

            "attendance_date":
                str(attendance.attendance_date),

            "login_time":
                str(attendance.login_time)
                if attendance.login_time
                else None,

            "logout_time":
                str(attendance.logout_time)
                if attendance.logout_time
                else None,

            "working_seconds":
                attendance.working_seconds,

            "lunch_seconds":
                attendance.lunch_seconds,

            "lunch_start_time":
                str(attendance.lunch_start_time)
                if attendance.lunch_start_time
                else None,

            "lunch_end_time":
                str(attendance.lunch_end_time)
                if attendance.lunch_end_time
                else None,

            "status":
                attendance.status,
        }
    }), 200


# ============================================================
# LUNCH IN
# PERSONAL ACTION
# ============================================================

@attendance_bp.route(
    "/api/attendance/lunch-in",
    methods=["POST"]
)
def lunch_in():

    current_employee_id, role = (
        get_current_user_context()
    )

    data = request.get_json() or {}

    employee_id = (
        data
        if isinstance(data, int)
        else data.get("employee_id")
    )

    if not employee_id:

        return jsonify({
            "success": False,
            "message":
                "employee_id is required."
        }), 400

    if not is_same_employee(
        current_employee_id,
        employee_id
    ):

        return jsonify({
            "success": False,
            "message":
                "Access denied. You can only manage your own attendance."
        }), 403

    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if not attendance:

        return jsonify({
            "success": False,
            "message":
                "Attendance record not found"
        }), 404

    if attendance.logout_time:

        return jsonify({
            "success": False,
            "message":
                "Cannot return from lunch after logout."
        }), 400

    if not attendance.lunch_start_time:

        return jsonify({
            "success": False,
            "message":
                "Lunch break was not started"
        }), 400

    attendance.lunch_end_time = datetime.now()

    lunch_seconds = int(
        (
            attendance.lunch_end_time
            - attendance.lunch_start_time
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
        "success": True,
        "message":
            "Returned from lunch",
        "attendance": {
            "attendance_id":
                attendance.attendance_id,

            "employee_id":
                attendance.employee_id,

            "attendance_date":
                str(attendance.attendance_date),

            "login_time":
                str(attendance.login_time)
                if attendance.login_time
                else None,

            "logout_time":
                str(attendance.logout_time)
                if attendance.logout_time
                else None,

            "working_seconds":
                attendance.working_seconds,

            "lunch_seconds":
                attendance.lunch_seconds,

            "lunch_start_time":
                str(attendance.lunch_start_time)
                if attendance.lunch_start_time
                else None,

            "lunch_end_time":
                str(attendance.lunch_end_time)
                if attendance.lunch_end_time
                else None,

            "status":
                attendance.status,
        }
    }), 200


# ============================================================
# CHECK OUT
# PERSONAL ACTION
# ============================================================

@attendance_bp.route(
    "/api/attendance/logout/<int:employee_id>",
    methods=["PUT"]
)
def employee_logout(employee_id):

    current_employee_id, role = (
        get_current_user_context()
    )

    if not is_same_employee(
        current_employee_id,
        employee_id
    ):

        return jsonify({
            "success": False,
            "message":
                "Access denied. You can only manage your own attendance."
        }), 403

    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if not attendance:

        return jsonify({
            "success": False,
            "message":
                "Attendance record not found"
        }), 404

    if attendance.logout_time:

        return jsonify({
            "success": False,
            "message":
                "Already logged out"
        }), 400

    attendance.logout_time = datetime.now()

    total_duration = (
        attendance.logout_time
        - attendance.login_time
    )

    # --------------------------------------------------------
    # Automatically close an active lunch
    # --------------------------------------------------------

    if (
        attendance.lunch_start_time
        and not attendance.lunch_end_time
    ):

        attendance.lunch_end_time = datetime.now()

        attendance.lunch_seconds = (
            attendance.lunch_seconds or 0
        ) + int(
            (
                attendance.lunch_end_time
                - attendance.lunch_start_time
            ).total_seconds()
        )

    # --------------------------------------------------------
    # Calculate working time
    # --------------------------------------------------------

    working_seconds = max(
        0,
        int(
            total_duration.total_seconds()
        )
        - (attendance.lunch_seconds or 0)
    )

    attendance.working_seconds = (
        working_seconds
    )

    # --------------------------------------------------------
    # Determine final status
    # --------------------------------------------------------

    employee = Employee.query.get(
        employee_id
    )

    if employee and employee.shift_id:

        shift = Shift.query.get(
            employee.shift_id
        )

        if shift:

            logout_time = (
                attendance.logout_time.time()
            )

            if logout_time < shift.end_time:

                attendance.status = (
                    "Early Logout"
                )

            else:

                attendance.status = (
                    "Completed"
                )

    else:

        attendance.status = "Logged Out"

    # --------------------------------------------------------
    # Attendance log
    # --------------------------------------------------------

    log = AttendanceLog(
        employee_id=employee_id,
        action="LOGOUT",
        timestamp=datetime.now()
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Logout recorded successfully",

        "working_seconds":
            attendance.working_seconds,

        "lunch_seconds":
            attendance.lunch_seconds,

        "status":
            attendance.status
    }), 200


# ============================================================
# TODAY'S PERSONAL ATTENDANCE
# ============================================================

@attendance_bp.route(
    "/api/attendance/today/<int:employee_id>",
    methods=["GET"]
)
def get_today_attendance(employee_id):

    current_employee_id, role = (
        get_current_user_context()
    )

    # --------------------------------------------------------
    # Only the employee themselves can use this endpoint.
    # --------------------------------------------------------

    if not is_same_employee(
        current_employee_id,
        employee_id
    ):

        return jsonify({
            "success": False,
            "message":
                "Access denied. You can only view your own attendance."
        }), 403

    attendance = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=date.today()
    ).first()

    if not attendance:

        return jsonify({
            "success": True,
            "logged_in": False,
            "attendance": None
        }), 200

    employee = Employee.query.get(
        employee_id
    )

    branch = None

    if employee and employee.branch_id:

        branch = Branch.query.get(
            employee.branch_id
        )

    shift = None

    if employee and employee.shift_id:

        shift = Shift.query.get(
            employee.shift_id
        )

    logged_in = (
        attendance.logout_time is None
    )

    return jsonify({

        "success": True,

        "logged_in":
            logged_in,

        "attendance": {

            "attendance_id":
                attendance.attendance_id,

            "employee_id":
                attendance.employee_id,

            "employee_name":
                employee.full_name
                if employee
                else None,

            "employee_code":
                employee.employee_code
                if employee
                else None,

            "branch_id":
                employee.branch_id
                if employee
                else None,

            "branch_name":
                branch.branch_name
                if branch
                else None,

            "role":
                employee.role
                if employee
                else None,

            "shift_name":
                shift.shift_name
                if shift
                else None,

            "attendance_date":
                str(
                    attendance.attendance_date
                ),

            "login_time":
                str(
                    attendance.login_time
                )
                if attendance.login_time
                else None,

            "logout_time":
                str(
                    attendance.logout_time
                )
                if attendance.logout_time
                else None,

            "working_seconds":
                attendance.working_seconds,

            "lunch_seconds":
                attendance.lunch_seconds,

            "lunch_start_time":
                str(
                    attendance.lunch_start_time
                )
                if attendance.lunch_start_time
                else None,

            "lunch_end_time":
                str(
                    attendance.lunch_end_time
                )
                if attendance.lunch_end_time
                else None,

            "status":
                attendance.status
        }

    }), 200


# ============================================================
# ATTENDANCE MANAGEMENT / LIST
#
# SUPER ADMIN:
#     Full access
#
# HR:
#     Requires hr_attendance permission
#
# EMPLOYEE:
#     Own records only
# ============================================================

@attendance_bp.route(
    "/api/attendance",
    methods=["GET"]
)
def get_attendance():

    current_employee_id, role = (
        get_current_user_context()
    )

    requested_employee_id = (
        request.args.get(
            "employee_id",
            type=int
        )
    )

    # --------------------------------------------------------
    # Employee
    # --------------------------------------------------------

    if role.lower() == "employee":

        if requested_employee_id is None:

            return jsonify({
                "success": False,
                "message":
                    "employee_id is required."
            }), 403

        if not is_same_employee(
            current_employee_id,
            requested_employee_id
        ):

            return jsonify({
                "success": False,
                "message":
                    "Access denied. You can only view your own attendance."
            }), 403

        query = Attendance.query.filter(
            Attendance.employee_id
            == current_employee_id
        )

    # --------------------------------------------------------
    # Super Admin / HR
    # --------------------------------------------------------

    else:

        if not can_manage_attendance(role):

            return jsonify({
                "success": False,
                "message":
                    "Access denied. Attendance permission is required."
            }), 403

        query = Attendance.query

        if requested_employee_id:

            query = query.filter(
                Attendance.employee_id
                == requested_employee_id
            )

    # --------------------------------------------------------
    # Fetch records
    # --------------------------------------------------------

    records = query.order_by(
        Attendance.attendance_date.desc(),
        Attendance.login_time.desc()
    ).all()

    attendance = []

    for record in records:

        employee = Employee.query.get(
            record.employee_id
        )

        department = None
        designation = None
        branch = None
        shift = None

        if employee and employee.department_id:

            department = Department.query.get(
                employee.department_id
            )

        if employee and employee.designation_id:

            designation = Designation.query.get(
                employee.designation_id
            )

        if employee and employee.branch_id:

            branch = Branch.query.get(
                employee.branch_id
            )

        if employee and employee.shift_id:

            shift = Shift.query.get(
                employee.shift_id
            )

        attendance.append({

            "attendance_id":
                record.attendance_id,

            "employee_id":
                record.employee_id,

            "employee_name":
                employee.full_name
                if employee
                else None,

            "employee_code":
                employee.employee_code
                if employee
                else None,

            "department_name":
                department.department_name
                if department
                else None,

            "designation_name":
                designation.designation_name
                if designation
                else None,

            "branch_id":
                employee.branch_id
                if employee
                else None,

            "branch_name":
                branch.branch_name
                if branch
                else None,

            "role":
                employee.role
                if employee
                else None,

            "shift_name":
                shift.shift_name
                if shift
                else None,

            "attendance_date":
                str(
                    record.attendance_date
                ),

            "login_time":
                str(record.login_time)
                if record.login_time
                else None,

            "logout_time":
                str(record.logout_time)
                if record.logout_time
                else None,

            "working_seconds":
                record.working_seconds,

            "lunch_seconds":
                record.lunch_seconds,

            "lunch_start_time":
                str(record.lunch_start_time)
                if record.lunch_start_time
                else None,

            "lunch_end_time":
                str(record.lunch_end_time)
                if record.lunch_end_time
                else None,

            "status":
                record.status,
        })

    return jsonify({
        "success": True,
        "attendance": attendance
    }), 200