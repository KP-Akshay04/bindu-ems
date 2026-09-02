from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from app import db
from app.models.department import Department


department_bp = Blueprint(
    "department_bp",
    __name__
)


# =========================================================
# AUTHORIZATION HELPERS
# =========================================================

def get_current_role():

    verify_jwt_in_request()

    claims = get_jwt()

    return str(
        claims.get("role", "")
    ).strip().lower()


def require_super_admin():

    role = get_current_role()

    return role == "super admin"


def management_access_denied():

    return jsonify({
        "success": False,
        "message":
            "Access denied. Super Admin permission is required."
    }), 403


# =========================================================
# CREATE DEPARTMENT
# SUPER ADMIN ONLY
# =========================================================

@department_bp.route(
    "/api/departments",
    methods=["POST"]
)
def create_department():

    if not require_super_admin():
        return management_access_denied()

    data = request.get_json() or {}

    department_name = str(
        data.get(
            "department_name",
            ""
        )
    ).strip()

    if not department_name:

        return jsonify({
            "success": False,
            "message":
                "Department name is required."
        }), 400

    department = Department(
        department_name=department_name,
        description=data.get(
            "description"
        )
    )

    db.session.add(
        department
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Department created successfully"
    }), 201


# =========================================================
# GET DEPARTMENTS
# ALL AUTHENTICATED USERS
# =========================================================

@department_bp.route(
    "/api/departments",
    methods=["GET"]
)
def get_departments():

    verify_jwt_in_request()

    departments = Department.query.all()

    result = []

    for dept in departments:

        result.append({

            "department_id":
                dept.department_id,

            "department_name":
                dept.department_name,

            "description":
                dept.description

        })

    return jsonify(result), 200


# =========================================================
# UPDATE DEPARTMENT
# SUPER ADMIN ONLY
# =========================================================

@department_bp.route(
    "/api/departments/<int:id>",
    methods=["PUT"]
)
def update_department(id):

    if not require_super_admin():
        return management_access_denied()

    department = Department.query.get_or_404(
        id
    )

    data = request.get_json() or {}

    department.department_name = data.get(
        "department_name",
        department.department_name
    )

    department.description = data.get(
        "description",
        department.description
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Department updated successfully"
    }), 200


# =========================================================
# DELETE DEPARTMENT
# SUPER ADMIN ONLY
# =========================================================

@department_bp.route(
    "/api/departments/<int:id>",
    methods=["DELETE"]
)
def delete_department(id):

    if not require_super_admin():
        return management_access_denied()

    department = Department.query.get_or_404(
        id
    )

    db.session.delete(
        department
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Department deleted successfully"
    }), 200