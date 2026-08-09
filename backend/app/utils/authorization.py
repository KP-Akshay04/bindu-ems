from functools import wraps

from flask import jsonify
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt,
)


def require_super_admin(fn):
    @wraps(fn)
    def decorated(*args, **kwargs):

        verify_jwt_in_request()

        claims = get_jwt()

        role = str(
            claims.get("role", "")
        ).strip().lower()

        if role not in [
            "super admin",
            "super_admin",
            "admin",
        ]:
            return jsonify({
                "success": False,
                "message": "Access denied."
            }), 403

        return fn(*args, **kwargs)

    return decorated


def has_permission(role, permission_key):
    """
    Check whether a role has a specific
    feature permission enabled.
    """

    from app.models.permission import Permission
    from app.models.role_permission import RolePermission

    normalized_role = str(
        role or ""
    ).strip().lower()

    # Super Admin always has unrestricted access.
    if normalized_role in [
        "super admin",
        "super_admin",
        "admin",
    ]:
        return True

    permission = Permission.query.filter_by(
        permission_key=permission_key
    ).first()

    if not permission:
        return False

    role_permission = RolePermission.query.filter_by(
        role=role,
        permission_id=permission.permission_id
    ).first()

    if not role_permission:
        return False

    return bool(role_permission.enabled)


def require_permission(permission_key):
    """
    Protect a route using a database-driven
    role permission.
    """

    def decorator(fn):

        @wraps(fn)
        def decorated(*args, **kwargs):

            verify_jwt_in_request()

            claims = get_jwt()

            role = claims.get("role")

            if not has_permission(
                role,
                permission_key
            ):
                return jsonify({
                    "success": False,
                    "message": "Access denied."
                }), 403

            return fn(*args, **kwargs)

        return decorated

    return decorator