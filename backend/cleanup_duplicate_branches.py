from app import create_app, db
from app.models.branch import Branch
from app.models.employee import Employee


# Newly created duplicate -> existing branch
DUPLICATES = {
    "Anakapalle": 35,
    "Gudivada": 57,
    "Jaggampeta": 56,
    "Machilipatnam": 46,
    "Madhurawada": 39,
    "Ongole": 47,
    "Rajahmundry": 51,
    "Tadepalligudem": 15,
    "Tirupati": 25,
    "Vishakhapatnam": 18,
    "Vizianagaram": 33,
    "Bhupalapalli": 32,
    "Chityala": 24,
    "Khammam": 19,
    "Miryalaguda": 58,
    "Moosapet": 17,
    "Siddipet": 29,
    "Warangal": 23,
    "HBR Layout": 14,
    "Mysoru": 34,
    "Kalyan Thane": 4,
}


def main():
    app = create_app()

    with app.app_context():

        deleted = []
        skipped = []

        try:
            for duplicate_name, correct_branch_id in DUPLICATES.items():

                duplicate = Branch.query.filter(
                    db.func.lower(Branch.branch_name)
                    == duplicate_name.lower()
                ).first()

                if not duplicate:
                    skipped.append(
                        f"{duplicate_name} -> duplicate not found"
                    )
                    continue

                employees = Employee.query.filter_by(
                    branch_id=duplicate.branch_id
                ).all()

                if employees:
                    skipped.append(
                        f"{duplicate_name} -> "
                        f"HAS EMPLOYEES, NOT DELETED"
                    )
                    continue

                correct_branch = Branch.query.get(
                    correct_branch_id
                )

                if not correct_branch:
                    skipped.append(
                        f"{duplicate_name} -> "
                        f"correct branch {correct_branch_id} not found"
                    )
                    continue

                db.session.delete(duplicate)

                deleted.append(
                    f"{duplicate.branch_id} | "
                    f"{duplicate.branch_name} -> "
                    f"{correct_branch.branch_id} | "
                    f"{correct_branch.branch_name}"
                )

            db.session.commit()

            print("\n========================================")
            print("DUPLICATE BRANCH CLEANUP COMPLETED")
            print("========================================")

            print("\nDELETED:")
            for item in deleted:
                print("  DELETED:", item)

            print("\nSKIPPED:")
            for item in skipped:
                print("  SKIPPED:", item)

            print("\n========================================")
            print(f"DELETED : {len(deleted)}")
            print(f"SKIPPED : {len(skipped)}")
            print("========================================")

            print(
                "\nNo employee records were modified."
            )

        except Exception:
            db.session.rollback()
            print("\nCLEANUP FAILED.")
            print("Database transaction rolled back.")
            raise


if __name__ == "__main__":
    main()