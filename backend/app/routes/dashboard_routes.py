from flask import Blueprint, jsonify

from app.models.employee import Employee
from app.models.branch import Branch
from app.models.department import Department
from app.models.leave_request import LeaveRequest
from app.models.payroll import Payroll
from app.models.attendance import Attendance

from datetime import date

dashboard_bp = Blueprint(
    "dashboard_bp",
    __name__
)

@dashboard_bp.route("/api/dashboard/summary", methods=["GET"])
def dashboard_summary():

    total_employees = Employee.query.count()

    total_branches = Branch.query.count()

    total_departments = Department.query.count()

    today_attendance = Attendance.query.filter_by(
        attendance_date=date.today()
    ).count()

    pending_leaves = LeaveRequest.query.filter_by(
        status="Pending"
    ).count()

    payroll_records = Payroll.query.count()

    return jsonify({
        "total_employees": total_employees,
        "total_branches": total_branches,
        "total_departments": total_departments,
        "today_attendance": today_attendance,
        "pending_leaves": pending_leaves,
        "payroll_records": payroll_records
    })

@dashboard_bp.route("/api/dashboard/leaves", methods=["GET"])
def dashboard_leaves():

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

@dashboard_bp.route("/api/dashboard/attendance", methods=["GET"])
def dashboard_attendance():

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

@dashboard_bp.route("/api/dashboard/payroll", methods=["GET"])
def dashboard_payroll():

    payrolls = Payroll.query.all()

    result = []

    for payroll in payrolls:

        result.append({
            "payroll_id": payroll.payroll_id,
            "employee_id": payroll.employee_id,
            "basic_salary": payroll.basic_salary,
            "allowances": payroll.allowances,
            "deductions": payroll.deductions,
            "net_salary": payroll.net_salary,
            "month": payroll.month,
            "year": payroll.year
        })

    return jsonify(result)