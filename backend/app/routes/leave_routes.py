from datetime import datetime

from flask import Blueprint, jsonify, request

from app import db
from app.models.department import Department
from app.models.designation import Designation
from app.models.employee import Employee
from app.models.leave_request import LeaveRequest

leave_bp = Blueprint(
    "leave_bp",
    __name__
)


def parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def get_department_name(employee):
    if not employee or not employee.department_id:
        return None

    department = Department.query.get(employee.department_id)
    return (
        department.department_name
        if department
        else None
    )


def get_designation_name(employee):
    if not employee or not employee.designation_id:
        return None

    designation = Designation.query.get(
        employee.designation_id
    )

    return (
        designation.designation_name
        if designation
        else None
    )


def serialize_leave(leave):

    employee = Employee.query.get(
        leave.employee_id
    )

    total_days = (
        (leave.end_date - leave.start_date).days
        + 1
    )

    return {

        "leave_id": leave.leave_id,

        "employee_id": leave.employee_id,

        "employee_code":
            employee.employee_code
            if employee else None,

        "employee_name":
            employee.full_name
            if employee else None,

        "role":
            employee.role
            if employee else None,

        "department":
            get_department_name(employee),

        "designation":
            get_designation_name(employee),

        "leave_type":
            leave.leave_type,

        "start_date":
            str(leave.start_date),

        "end_date":
            str(leave.end_date),

        "duration":
            total_days,

        "reason":
            leave.reason,

        "status":
            leave.status,

        "leave_balance":
            employee.leave_balance
            if employee else None
    }


@leave_bp.route(
    "/api/leaves/apply",
    methods=["POST"]
)
def apply_leave():

    data = request.get_json()

    employee_id = data.get(
        "employee_id"
    )

    employee = Employee.query.get(
        employee_id
    )

    if not employee:
        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    leave_type = str(
        data.get("leave_type", "")
    ).strip()

    reason = str(
        data.get("reason", "")
    ).strip()

    start_date = parse_date(
        data.get("start_date", "")
    )

    end_date = parse_date(
        data.get("end_date", "")
    )

    if not leave_type:
        return jsonify({
            "success": False,
            "message": "Leave type is required."
        }), 400

    if not reason:
        return jsonify({
            "success": False,
            "message": "Reason is required."
        }), 400

    if not start_date or not end_date:
        return jsonify({
            "success": False,
            "message": "Invalid leave dates."
        }), 400

    if end_date < start_date:
        return jsonify({
            "success": False,
            "message": "End date cannot be before start date."
        }), 400

    total_days = (
        end_date - start_date
    ).days + 1

    if total_days <= 0:
        return jsonify({
            "success": False,
            "message": "Invalid duration."
        }), 400

    overlapping_leave = LeaveRequest.query.filter(

        LeaveRequest.employee_id == employee_id,

        LeaveRequest.status != "Rejected",

        LeaveRequest.start_date <= end_date,

        LeaveRequest.end_date >= start_date

    ).first()

    if overlapping_leave:

        return jsonify({
            "success": False,
            "message":
                "A leave request already exists for the selected dates."
        }), 409

    leave = LeaveRequest(

        employee_id=employee.employee_id,

        leave_type=leave_type,

        start_date=start_date,

        end_date=end_date,

        reason=reason,

        status="Pending"
    )

    db.session.add(
        leave
    )

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Leave request submitted successfully.",

        "leave":
            serialize_leave(leave)

    }), 201


@leave_bp.route(
    "/api/leaves",
    methods=["GET"]
)
def get_all_leaves():

    employee_id = request.args.get(
        "employee_id"
    )

    status = request.args.get(
        "status"
    )

    query = LeaveRequest.query

    if employee_id:
        query = query.filter(
            LeaveRequest.employee_id == employee_id
        )

    if status:
        query = query.filter(
            LeaveRequest.status == status
        )

    leaves = query.order_by(
        LeaveRequest.start_date.desc()
    ).all()

    return jsonify({

        "success": True,

        "count": len(leaves),

        "leaves": [
            serialize_leave(leave)
            for leave in leaves
        ]

    }), 200

@leave_bp.route(
    "/api/leaves/<int:leave_id>",
    methods=["GET"]
)
def get_leave_details(leave_id):

    leave = LeaveRequest.query.get(leave_id)

    if not leave:
        return jsonify({
            "success": False,
            "message": "Leave request not found."
        }), 404

    return jsonify({
        "success": True,
        "leave": serialize_leave(leave)
    }), 200


@leave_bp.route(
    "/api/leaves/<int:leave_id>/approve",
    methods=["PUT"]
)
def approve_leave(leave_id):

    leave = LeaveRequest.query.get(leave_id)

    if not leave:
        return jsonify({
            "success": False,
            "message": "Leave request not found."
        }), 404

    if leave.status == "Approved":
        return jsonify({
            "success": False,
            "message": "Leave request is already approved."
        }), 400

    if leave.status == "Rejected":
        return jsonify({
            "success": False,
            "message": "Rejected leave cannot be approved."
        }), 400

    employee = Employee.query.get(
        leave.employee_id
    )

    if not employee:
        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    total_days = (
        leave.end_date -
        leave.start_date
    ).days + 1

    if employee.leave_balance < total_days:
        return jsonify({
            "success": False,
            "message": "Insufficient leave balance."
        }), 400

    employee.leave_balance -= total_days

    leave.status = "Approved"

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Leave approved successfully.",

        "remaining_balance":
            employee.leave_balance,

        "leave":
            serialize_leave(leave)

    }), 200


@leave_bp.route(
    "/api/leaves/<int:leave_id>/reject",
    methods=["PUT"]
)
def reject_leave(leave_id):

    leave = LeaveRequest.query.get(
        leave_id
    )

    if not leave:
        return jsonify({
            "success": False,
            "message": "Leave request not found."
        }), 404

    if leave.status == "Rejected":
        return jsonify({
            "success": False,
            "message": "Leave request is already rejected."
        }), 400

    if leave.status == "Approved":
        return jsonify({
            "success": False,
            "message":
                "Approved leave cannot be rejected."
        }), 400

    leave.status = "Rejected"

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Leave rejected successfully.",

        "leave":
            serialize_leave(leave)

    }), 200


@leave_bp.route(
    "/api/leaves/<int:leave_id>/cancel",
    methods=["PUT"]
)
def cancel_leave(leave_id):

    leave = LeaveRequest.query.get(
        leave_id
    )

    if not leave:
        return jsonify({
            "success": False,
            "message": "Leave request not found."
        }), 404

    employee = Employee.query.get(
        leave.employee_id
    )

    if not employee:
        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    if leave.status == "Approved":

        total_days = (
            leave.end_date -
            leave.start_date
        ).days + 1

        employee.leave_balance += total_days

    db.session.delete(leave)

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Leave request cancelled successfully.",

        "leave_balance":
            employee.leave_balance

    }), 200

@leave_bp.route(
    "/api/leaves/summary",
    methods=["GET"]
)
def leave_summary():

    total = LeaveRequest.query.count()

    pending = LeaveRequest.query.filter_by(
        status="Pending"
    ).count()

    approved = LeaveRequest.query.filter_by(
        status="Approved"
    ).count()

    rejected = LeaveRequest.query.filter_by(
        status="Rejected"
    ).count()

    return jsonify({
        "success": True,
        "summary": {
            "total": total,
            "pending": pending,
            "approved": approved,
            "rejected": rejected
        }
    }), 200


@leave_bp.route(
    "/api/leaves/search",
    methods=["GET"]
)
def search_leaves():

    employee_code = request.args.get(
        "employee_code",
        ""
    ).strip()

    employee_name = request.args.get(
        "employee_name",
        ""
    ).strip()

    status = request.args.get(
        "status",
        ""
    ).strip()

    leave_type = request.args.get(
        "leave_type",
        ""
    ).strip()

    query = LeaveRequest.query

    if employee_code:

        employee = Employee.query.filter(
            Employee.employee_code.ilike(
                f"%{employee_code}%"
            )
        ).first()

        if not employee:
            return jsonify({
                "success": True,
                "count": 0,
                "leaves": []
            }), 200

        query = query.filter(
            LeaveRequest.employee_id == employee.employee_id
        )

    if employee_name:

        employees = Employee.query.filter(
            Employee.full_name.ilike(
                f"%{employee_name}%"
            )
        ).all()

        employee_ids = [
            emp.employee_id
            for emp in employees
        ]

        if not employee_ids:
            return jsonify({
                "success": True,
                "count": 0,
                "leaves": []
            }), 200

        query = query.filter(
            LeaveRequest.employee_id.in_(employee_ids)
        )

    if status:

        query = query.filter(
            LeaveRequest.status == status
        )

    if leave_type:

        query = query.filter(
            LeaveRequest.leave_type == leave_type
        )

    leaves = query.order_by(
        LeaveRequest.start_date.desc()
    ).all()

    return jsonify({

        "success": True,

        "count": len(leaves),

        "leaves": [
            serialize_leave(leave)
            for leave in leaves
        ]

    }), 200


@leave_bp.route(
    "/api/leaves/balance/<int:employee_id>",
    methods=["GET"]
)
def get_leave_balance(employee_id):

    employee = Employee.query.get(
        employee_id
    )

    if not employee:
        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    approved_days = 0

    approved_leaves = LeaveRequest.query.filter_by(
        employee_id=employee.employee_id,
        status="Approved"
    ).all()

    for leave in approved_leaves:

        approved_days += (
            leave.end_date -
            leave.start_date
        ).days + 1

    pending_days = 0

    pending_leaves = LeaveRequest.query.filter_by(
        employee_id=employee.employee_id,
        status="Pending"
    ).all()

    for leave in pending_leaves:

        pending_days += (
            leave.end_date -
            leave.start_date
        ).days + 1

    return jsonify({

        "success": True,

        "employee_id":
            employee.employee_id,

        "employee_code":
            employee.employee_code,

        "employee_name":
            employee.full_name,

        "leave_balance":
            employee.leave_balance,

        "approved_days":
            approved_days,

        "pending_days":
            pending_days

    }), 200


@leave_bp.route(
    "/api/leaves/types",
    methods=["GET"]
)
def leave_types():

    return jsonify({

        "success": True,

        "leave_types": [

            "Casual Leave",

            "Sick Leave",

            "Earned Leave",

            "Emergency Leave",

            "Half Day",

            "Work From Home"

        ]

    }), 200