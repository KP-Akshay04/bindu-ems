from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from app import db
from app.models.branch import Branch


branch_bp = Blueprint(
    "branch_bp",
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


def require_authenticated_access():

    verify_jwt_in_request()

    return True


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
# CREATE BRANCH
# SUPER ADMIN ONLY
# =========================================================

@branch_bp.route(
    "/api/branches",
    methods=["POST"]
)
def create_branch():

    if not require_super_admin():
        return management_access_denied()

    data = request.get_json() or {}

    branch_name = str(
        data.get(
            "branch_name",
            ""
        )
    ).strip()

    if not branch_name:

        return jsonify({
            "success": False,
            "message": "Branch name is required."
        }), 400

    branch = Branch(

        branch_name=branch_name,

        location=data.get(
            "location"
        ),

        latitude=data.get(
            "latitude"
        ),

        longitude=data.get(
            "longitude"
        ),

        allowed_radius=data.get(
            "allowed_radius",
            100
        )

    )

    db.session.add(
        branch
    )

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Branch created successfully"

    }), 201


# =========================================================
# GET BRANCHES
# ALL AUTHENTICATED USERS
# =========================================================

@branch_bp.route(
    "/api/branches",
    methods=["GET"]
)
def get_branches():

    require_authenticated_access()

    branches = Branch.query.all()

    result = []

    for branch in branches:

        result.append({

            "branch_id":
                branch.branch_id,

            "branch_name":
                branch.branch_name,

            "location":
                branch.location,

            "latitude":
                branch.latitude,

            "longitude":
                branch.longitude,

            "allowed_radius":
                branch.allowed_radius

        })

    return jsonify(result), 200


# =========================================================
# UPDATE BRANCH
# SUPER ADMIN ONLY
# =========================================================

@branch_bp.route(
    "/api/branches/<int:id>",
    methods=["PUT"]
)
def update_branch(id):

    if not require_super_admin():
        return management_access_denied()

    branch = Branch.query.get_or_404(
        id
    )

    data = request.get_json() or {}

    branch.branch_name = data.get(
        "branch_name",
        branch.branch_name
    )

    branch.location = data.get(
        "location",
        branch.location
    )

    branch.latitude = data.get(
        "latitude",
        branch.latitude
    )

    branch.longitude = data.get(
        "longitude",
        branch.longitude
    )

    branch.allowed_radius = data.get(
        "allowed_radius",
        branch.allowed_radius
    )

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Branch updated successfully"

    }), 200


# =========================================================
# DELETE BRANCH
# SUPER ADMIN ONLY
# =========================================================

@branch_bp.route(
    "/api/branches/<int:id>",
    methods=["DELETE"]
)
def delete_branch(id):

    if not require_super_admin():
        return management_access_denied()

    branch = Branch.query.get_or_404(
        id
    )

    db.session.delete(
        branch
    )

    db.session.commit()

    return jsonify({

        "success": True,

        "message":
            "Branch deleted successfully"

    }), 200