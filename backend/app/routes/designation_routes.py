from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from app import db
from app.models.designation import Designation


designation_bp = Blueprint(
    "designation_bp",
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
# CREATE DESIGNATION
# SUPER ADMIN ONLY
# =========================================================

@designation_bp.route(
    "/api/designations",
    methods=["POST"]
)
def create_designation():

    if not require_super_admin():
        return management_access_denied()

    data = request.get_json() or {}

    designation_name = str(
        data.get(
            "designation_name",
            ""
        )
    ).strip()

    if not designation_name:

        return jsonify({
            "success": False,
            "message":
                "Designation name is required."
        }), 400

    designation = Designation(
        designation_name=designation_name,
        status=data.get(
            "status",
            "Active"
        )
    )

    db.session.add(
        designation
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Designation created successfully"
    }), 201


# =========================================================
# GET DESIGNATIONS
# ALL AUTHENTICATED USERS
# =========================================================

@designation_bp.route(
    "/api/designations",
    methods=["GET"]
)
def get_designations():

    verify_jwt_in_request()

    designations = Designation.query.all()

    result = []

    for des in designations:

        result.append({

            "designation_id":
                des.designation_id,

            "designation_name":
                des.designation_name,

            "status":
                des.status

        })

    return jsonify(result), 200


# =========================================================
# UPDATE DESIGNATION
# SUPER ADMIN ONLY
# =========================================================

@designation_bp.route(
    "/api/designations/<int:id>",
    methods=["PUT"]
)
def update_designation(id):

    if not require_super_admin():
        return management_access_denied()

    designation = Designation.query.get_or_404(
        id
    )

    data = request.get_json() or {}

    designation.designation_name = data.get(
        "designation_name",
        designation.designation_name
    )

    designation.status = data.get(
        "status",
        designation.status
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Designation updated successfully"
    }), 200


# =========================================================
# DELETE DESIGNATION
# SUPER ADMIN ONLY
# =========================================================

@designation_bp.route(
    "/api/designations/<int:id>",
    methods=["DELETE"]
)
def delete_designation(id):

    if not require_super_admin():
        return management_access_denied()

    designation = Designation.query.get_or_404(
        id
    )

    db.session.delete(
        designation
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message":
            "Designation deleted successfully"
    }), 200