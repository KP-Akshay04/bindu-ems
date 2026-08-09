from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt

from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.utils.authorization import require_super_admin


access_control_bp = Blueprint(
    "access_control_bp",
    __name__
)


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

    if normalized_role in [
        "super admin",
        "super_admin",
        "admin"
    ]:
        return jsonify({
            "success": False,
            "message": "Super Admin access cannot be disabled."
        }), 400

    role_permission = RolePermission.query.filter_by(
        role=role,
        permission_id=permission.permission_id
    ).first()

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
                role,

            "enabled":
                role_permission.enabled
        }
    }), 200