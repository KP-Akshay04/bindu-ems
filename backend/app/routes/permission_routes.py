from flask import Blueprint, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from app.models.permission import Permission
from app.models.role_permission import RolePermission


permission_bp = Blueprint(
    "permission_bp",
    __name__
)


@permission_bp.route(
    "/api/my-permissions",
    methods=["GET"]
)
def get_my_permissions():

    verify_jwt_in_request()

    claims = get_jwt()

    role = str(
        claims.get("role", "")
    ).strip()

    if not role:
        return jsonify({
            "success": False,
            "message": "Role information is missing."
        }), 403

    normalized_role = role.lower()

    # Super Admin always has unrestricted access.
    if normalized_role in [
        "super admin",
        "super_admin",
        "admin",
    ]:
        return jsonify({
            "success": True,
            "role": "Super Admin",
            "permissions": {
                "hr_dashboard": True,
                "hr_depot_employees": True,
                "hr_depot_managers": True,
                "hr_attendance": True,
                "hr_leaves": True,
                "hr_payroll": True,
                "hr_announcements": True,
                "hr_shifts": True,
            }
        }), 200

    role_permissions = (
        RolePermission.query
        .join(Permission)
        .filter(
            RolePermission.role == role
        )
        .all()
    )

    permissions = {}

    for role_permission in role_permissions:

        permissions[
            role_permission.permission.permission_key
        ] = bool(
            role_permission.enabled
        )

    return jsonify({
        "success": True,
        "role": role,
        "permissions": permissions
    }), 200