from app import db
from app.models.permission import Permission
from app.models.role_permission import RolePermission


INITIAL_PERMISSIONS = [
    {
        "permission_key": "hr_depot_employees",
        "permission_name": "Depot Employees",
        "description": "Allow HR to access the Depot Employees module.",
    },
    {
        "permission_key": "hr_attendance",
        "permission_name": "Attendance",
        "description": "Allow HR to access the Attendance module.",
    },
]


def seed_permissions():
    for item in INITIAL_PERMISSIONS:

        permission = Permission.query.filter_by(
            permission_key=item["permission_key"]
        ).first()

        if not permission:
            permission = Permission(
                permission_key=item["permission_key"],
                permission_name=item["permission_name"],
                description=item["description"],
            )

            db.session.add(permission)
            db.session.flush()

        existing_role_permission = RolePermission.query.filter_by(
            role="HR",
            permission_id=permission.permission_id
        ).first()

        if not existing_role_permission:
            db.session.add(
                RolePermission(
                    role="HR",
                    permission_id=permission.permission_id,
                    enabled=True
                )
            )

    db.session.commit()