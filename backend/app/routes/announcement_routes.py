from flask import Blueprint, request, jsonify

from app import db
from app.models.announcement import Announcement

announcement_bp = Blueprint(
    "announcement_bp",
    __name__
)


@announcement_bp.route(
    "/api/announcements",
    methods=["POST"]
)
def create_announcement():

    data = request.get_json()

    announcement = Announcement(
        title=data["title"],
        message=data["message"],
        created_by=data.get("created_by")
    )

    db.session.add(announcement)
    db.session.commit()

    return jsonify({
        "message": "Announcement created successfully"
    }), 201


@announcement_bp.route(
    "/api/announcements",
    methods=["GET"]
)
def get_announcements():

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

    return jsonify(result)