from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from app import db
from app.models.announcement import Announcement
from app.utils.authorization import has_permission


announcement_bp = Blueprint(
    "announcement_bp",
    __name__
)


# =========================================================
# AUTHORIZATION HELPERS
# =========================================================

def get_current_role():
    """
    Returns normalized role from JWT.
    """
    verify_jwt_in_request()

    claims = get_jwt()

    return str(
        claims.get("role", "")
    ).strip().lower()


def get_current_employee_id():
    """
    JWT identity is the employee_id.
    """
    verify_jwt_in_request()

    claims = get_jwt()

    try:
        return int(claims.get("sub"))
    except (TypeError, ValueError):
        return None


def require_announcement_management_access():
    """
    Super Admin:
        Full announcement management access.

    HR:
        Requires hr_announcements permission.

    Employee:
        No management access.
    """

    role = get_current_role()

    if role == "super admin":
        return True

    if role == "hr":
        return has_permission(
            "hr",
            "hr_announcements"
        )

    return False


def management_access_denied():
    return jsonify({
        "success": False,
        "message":
            "Access denied. Announcement management permission is required."
    }), 403


# =========================================================
# CREATE ANNOUNCEMENT
# =========================================================

@announcement_bp.route(
    "/api/announcements",
    methods=["POST"]
)
def create_announcement():

    if not require_announcement_management_access():
        return management_access_denied()

    data = request.get_json() or {}

    title = str(
        data.get(
            "title",
            ""
        )
    ).strip()

    message = str(
        data.get(
            "message",
            ""
        )
    ).strip()

    if not title:
        return jsonify({
            "message": "Title is required."
        }), 400

    if not message:
        return jsonify({
            "message": "Message is required."
        }), 400

    current_employee_id = get_current_employee_id()

    announcement = Announcement(
        title=title,
        message=message,
        created_by=current_employee_id
    )

    db.session.add(
        announcement
    )

    db.session.commit()

    return jsonify({
        "message":
            "Announcement created successfully"
    }), 201


# =========================================================
# DELETE ANNOUNCEMENT
# =========================================================

@announcement_bp.route(
    "/api/announcements/<int:announcement_id>",
    methods=["DELETE"]
)
def delete_announcement(announcement_id):

    if not require_announcement_management_access():
        return management_access_denied()

    announcement = db.session.get(
        Announcement,
        announcement_id
    )

    if not announcement:

        return jsonify({
            "message":
                "Announcement not found"
        }), 404

    db.session.delete(
        announcement
    )

    db.session.commit()

    return jsonify({
        "message":
            "Announcement deleted successfully"
    }), 200


# =========================================================
# GET ANNOUNCEMENTS
# =========================================================

@announcement_bp.route(
    "/api/announcements",
    methods=["GET"]
)
def get_announcements():

    # All authenticated roles can view announcements.
    verify_jwt_in_request()

    announcements = (
        Announcement.query
        .order_by(
            Announcement.created_at.desc()
        )
        .all()
    )

    result = []

    for a in announcements:

        result.append({

            "announcement_id":
                a.announcement_id,

            "title":
                a.title,

            "message":
                a.message,

            "created_by":
                a.created_by,

            "created_at":
                a.created_at.isoformat()
                if a.created_at
                else None

        })

    return jsonify(result), 200