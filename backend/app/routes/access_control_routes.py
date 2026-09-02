from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    get_jwt,
    verify_jwt_in_request
)

from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.utils.authorization import require_super_admin


access_control_bp = Blueprint(
    "access_control_bp",
    __name__
)


# ============================================================
# GET ALL ACCESS CONTROL SETTINGS
# SUPER ADMIN ONLY
# ============================================================

@access_control_bp.route(
    "/api/access-control",
    methods=["GET"]
)
@require_super_admin
def get_access_control():

    permissions = (
        Permission.query
        .order_by(Permission.permission_id.asc())
        .all()
    )

    result = []

    for permission in permissions:

        role_permissions = (
            RolePermission.query
            .filter_by(
                permission_id=permission.permission_id
            )
            .all()
        )

        roles = {}

        for role_permission in role_permissions:

            roles[role_permission.role] = (
                role_permission.enabled
            )

        result.append({
            "permission_id":
                permission.permission_id,

            "permission_key":
                permission.permission_key,

            "permission_name":
                permission.permission_name,

            "description":
                permission.description,

            "roles":
                roles
        })

    return jsonify({
        "success": True,
        "permissions": result
    }), 200


# ============================================================
# GET CURRENT USER PERMISSIONS
# USED BY HR
# ============================================================

@access_control_bp.route(
    "/api/access-control/my-permissions",
    methods=["GET"]
)
def get_my_permissions():

    # --------------------------------------------------------
    # Verify JWT
    # --------------------------------------------------------

    verify_jwt_in_request()

    claims = get_jwt()

    role = str(
        claims.get("role", "")
    ).strip()

    if not role:
        return jsonify({
            "success": False,
            "message": "User role not found in token."
        }), 401

    normalized_role = role.lower()

    # --------------------------------------------------------
    # Get all permissions
    # --------------------------------------------------------

    permissions = (
        Permission.query
        .order_by(Permission.permission_id.asc())
        .all()
    )

    result = {}

    # --------------------------------------------------------
    # Super Admin automatically has all permissions
    # --------------------------------------------------------

    if normalized_role in [
        "super admin",
        "super_admin",
        "admin"
    ]:

        for permission in permissions:

            result[
                permission.permission_key
            ] = True

        return jsonify({
            "success": True,
            "role": role,
            "permissions": result
        }), 200

    # --------------------------------------------------------
    # HR / other roles
    # --------------------------------------------------------

    for permission in permissions:

        role_permission = (
            RolePermission.query
            .filter(
                RolePermission.permission_id ==
                    permission.permission_id
            )
            .filter(
                RolePermission.role.ilike(role)
            )
            .first()
        )

        result[
            permission.permission_key
        ] = (
            bool(role_permission.enabled)
            if role_permission
            else False
        )

    return jsonify({
        "success": True,
        "role": role,
        "permissions": result
    }), 200


# ============================================================
# UPDATE ACCESS CONTROL
# SUPER ADMIN ONLY
# ============================================================

@access_control_bp.route(
    "/api/access-control/<string:permission_key>",
    methods=["PUT"]
)
@require_super_admin
def update_access_control(permission_key):

    data = request.get_json() or {}

    role = str(
        data.get("role", "")
    ).strip()

    enabled = data.get("enabled")

    if not role:
        return jsonify({
            "success": False,
            "message": "Role is required."
        }), 400

    if not isinstance(enabled, bool):
        return jsonify({
            "success": False,
            "message": "enabled must be true or false."
        }), 400

    permission = Permission.query.filter_by(
        permission_key=permission_key
    ).first()

    if not permission:
        return jsonify({
            "success": False,
            "message": "Permission not found."
        }), 404

    normalized_role = role.lower()

    # --------------------------------------------------------
    # Super Admin cannot be disabled
    # --------------------------------------------------------

    if normalized_role in [
        "super admin",
        "super_admin",
        "admin"
    ]:

        return jsonify({
            "success": False,
            "message": "Super Admin access cannot be disabled."
        }), 400

    # --------------------------------------------------------
    # Find existing role permission
    # Case-insensitive role matching
    # --------------------------------------------------------

    role_permission = (
        RolePermission.query
        .filter(
            RolePermission.permission_id ==
                permission.permission_id
        )
        .filter(
            RolePermission.role.ilike(role)
        )
        .first()
    )

    # --------------------------------------------------------
    # Create if it doesn't exist
    # --------------------------------------------------------

    if not role_permission:

        role_permission = RolePermission(
            role=role,
            permission_id=permission.permission_id,
            enabled=enabled
        )

        from app import db

        db.session.add(role_permission)

    else:

        role_permission.enabled = enabled

    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    from app import db

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Access control updated successfully.",
        "permission": {

            "permission_key":
                permission.permission_key,

            "permission_name":
                permission.permission_name,

            "role":
                role_permission.role,

            "enabled":
                role_permission.enabled
        }
    }), 200