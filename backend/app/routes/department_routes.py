from flask import Blueprint, request, jsonify

from app import db
from app.models.department import Department

department_bp = Blueprint(
    "department_bp",
    __name__
)


@department_bp.route("/api/departments", methods=["POST"])
def create_department():

    data = request.get_json()

    department = Department(
        department_name=data["department_name"],
        description=data.get("description")
    )

    db.session.add(department)
    db.session.commit()

    return jsonify({
        "message": "Department created successfully"
    }), 201


@department_bp.route("/api/departments", methods=["GET"])
def get_departments():

    departments = Department.query.all()

    result = []

    for dept in departments:
        result.append({
            "department_id": dept.department_id,
            "department_name": dept.department_name,
            "description": dept.description
        })

    return jsonify(result)

@department_bp.route("/api/departments/<int:id>", methods=["PUT"])
def update_department(id):

    department = Department.query.get_or_404(id)

    data = request.get_json()

    department.department_name = data.get(
        "department_name",
        department.department_name
    )

    department.description = data.get(
        "description",
        department.description
    )

    db.session.commit()

    return jsonify({
        "message": "Department updated successfully"
    })

@department_bp.route("/api/departments/<int:id>", methods=["DELETE"])
def delete_department(id):

    department = Department.query.get_or_404(id)

    db.session.delete(department)
    db.session.commit()

    return jsonify({
        "message": "Department deleted successfully"
    })
