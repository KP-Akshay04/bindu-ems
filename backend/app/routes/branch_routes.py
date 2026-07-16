from flask import Blueprint, request, jsonify

from app import db
from app.models.branch import Branch

branch_bp = Blueprint(
    "branch_bp",
    __name__
)


@branch_bp.route("/api/branches", methods=["POST"])
def create_branch():

    data = request.get_json()

    branch = Branch(
        branch_name=data["branch_name"],
        location=data.get("location"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        allowed_radius=data.get("allowed_radius", 100)
    )

    db.session.add(branch)
    db.session.commit()

    return jsonify({
        "message": "Branch created successfully"
    }), 201


@branch_bp.route("/api/branches", methods=["GET"])
def get_branches():

    branches = Branch.query.all()

    result = []

    for branch in branches:
        result.append({
            "branch_id": branch.branch_id,
            "branch_name": branch.branch_name,
            "location": branch.location,
            "latitude": branch.latitude,
            "longitude": branch.longitude,
            "allowed_radius": branch.allowed_radius
        })

    return jsonify(result)

@branch_bp.route("/api/branches/<int:id>", methods=["PUT"])
def update_branch(id):

    branch = Branch.query.get_or_404(id)

    data = request.get_json()

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
        "message": "Branch updated successfully"
    })

@branch_bp.route("/api/branches/<int:id>", methods=["DELETE"])
def delete_branch(id):

    branch = Branch.query.get_or_404(id)

    db.session.delete(branch)
    db.session.commit()

    return jsonify({
        "message": "Branch deleted successfully"
    })