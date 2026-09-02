from app import create_app, db
from app.models.permission import Permission
from app.models.role_permission import RolePermission


PERMISSIONS = [
    {
        "permission_key": "hr_dashboard",
        "permission_name": "Dashboard",
        "description": "Access to the HR dashboard",
    },
    {
        "permission_key": "hr_depot_employees",
        "permission_name": "Employees",
        "description": "Access to employee management",
    },
    {
        "permission_key": "hr_depot_managers",
        "permission_name": "Depot Managers",
        "description": "Access to depot manager management",
    },
    {
        "permission_key": "hr_attendance",
        "permission_name": "Attendance",
        "description": "Access to attendance management",
    },
    {
        "permission_key": "hr_leaves",
        "permission_name": "Leave Management",
        "description": "Access to leave management",
    },
    {
        "permission_key": "hr_payroll",
        "permission_name": "Payroll",
        "description": "Access to payroll management",
    },
    {
        "permission_key": "hr_announcements",
        "permission_name": "Announcements",
        "description": "Access to announcements",
    },
    {
        "permission_key": "hr_shifts",
        "permission_name": "Shift Management",
        "description": "Access to shift management",
    },
]


def seed_permissions():

    app = create_app()

    with app.app_context():

        print("\n========================================")
        print("ACCESS CONTROL PERMISSION SEED")
        print("========================================\n")

        for data in PERMISSIONS:

            permission = Permission.query.filter_by(
                permission_key=data["permission_key"]
            ).first()

            if not permission:

                permission = Permission(
                    permission_key=data["permission_key"],
                    permission_name=data["permission_name"],
                    description=data["description"],
                )

                db.session.add(permission)
                db.session.flush()

                print(
                    f"CREATED: "
                    f"{permission.permission_key}"
                )

            else:

                permission.permission_name = (
                    data["permission_name"]
                )

                permission.description = (
                    data["description"]
                )

                print(
                    f"EXISTS: "
                    f"{permission.permission_key}"
                )

            # Ensure HR has the permission enabled
            role_permission = RolePermission.query.filter_by(
                role="HR",
                permission_id=permission.permission_id
            ).first()

            if not role_permission:

                role_permission = RolePermission(
                    role="HR",
                    permission_id=permission.permission_id,
                    enabled=True
                )

                db.session.add(role_permission)

                print(
                    f"  → HR permission CREATED: "
                    f"{permission.permission_key}"
                )

            else:

                print(
                    f"  → HR permission EXISTS: "
                    f"{permission.permission_key} "
                    f"(enabled={role_permission.enabled})"
                )

        db.session.commit()

        print("\n========================================")
        print("ACCESS CONTROL SEED COMPLETED")
        print("========================================")


if __name__ == "__main__":
    seed_permissions()