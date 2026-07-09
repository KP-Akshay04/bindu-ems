from flask import Blueprint, request, jsonify

from app import db
from app.models.designation import Designation

designation_bp = Blueprint(
    "designation_bp",
    __name__
)


@designation_bp.route("/api/designations", methods=["POST"])
def create_designation():

    data = request.get_json()

    designation = Designation(
    designation_name=data["designation_name"],
    status=data.get("status", "Active")
)

    db.session.add(designation)
    db.session.commit()

    return jsonify({
        "message": "Designation created successfully"
    }), 201


@designation_bp.route("/api/designations", methods=["GET"])
def get_designations():

    designations = Designation.query.all()

    result = []

    for des in designations:

        result.append({
    "designation_id": des.designation_id,
    "designation_name": des.designation_name,
    "status": des.status
})

    return jsonify(result)


@designation_bp.route("/api/designations/<int:id>", methods=["PUT"])
def update_designation(id):

    designation = Designation.query.get_or_404(id)

    data = request.get_json()

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
        "message": "Designation updated successfully"
    })


@designation_bp.route("/api/designations/<int:id>", methods=["DELETE"])
def delete_designation(id):

    designation = Designation.query.get_or_404(id)

    db.session.delete(designation)
    db.session.commit()

    return jsonify({
        "message": "Designation deleted successfully"
    })