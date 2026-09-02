from app import create_app, db
from app.models.branch import Branch


# ---------------------------------------------------------
# COMPANY GPS DATA
# ---------------------------------------------------------

DEPOTS = {
    "Addanki": (15.815171392285299, 79.9815210993563),
    "Amalapuram": (16.585340642229465, 82.02020784231965),
    "Anakapalle": (17.676217093906956, 82.99653988765554),
    "Annavaram": (17.306829481472747, 82.44105834985685),
    "Bhimavaram": (16.555737987402402, 81.50654532743194),
    "Chebrolu": (16.204626359368984, 80.52259724108424),
    "Chittoor": (13.206728202368295, 79.09379246920255),
    "Eluru": (16.71773635849577, 81.11414197893097),
    "Gajuwaka": (17.713069159463123, 83.14836166949564),
    "Gudivada": (16.433486580791513, 81.00767424000475),
    "Jadupudi": (19.028188161122802, 84.6162840938399),
    "Jaggampeta": (17.177905045438585, 82.06135480069423),
    "Jangareddygudem": (17.12700310067622, 81.29034361650432),
    "Kadapa": (14.480278412349687, 78.80297428209305),
    "Kakinada": (17.00587439538644, 82.26491131017862),
    "Kavali": (14.924984019709516, 79.99592226780922),
    "Machilipatnam": (16.19830721461399, 81.14963578396521),
    "Kosta": (18.164427593593206, 83.66471717397543),
    "Kurnool": (15.826850066040269, 78.01214121095526),
    "Madhurawada": (17.809227908002978, 83.36178527349827),
    "Nandyal": (15.487121546169666, 78.49576745263174),
    "Naidupeta": (13.894522292146027, 79.88393756858807),
    "Nellore": (14.458013107272663, 80.01799159558657),
    "Ongole": (15.519188271153658, 80.04585195516772),
    "Palasa": (18.77553162841887, 84.42645748582235),
    "Palakollu": (16.52007196198046, 81.737556307751),
    "Parvathipuram": (18.780175830752736, 83.44148307472302),
    "Rajahmundry": (16.994650240393664, 81.78194322316443),
    "Rajam": (18.452479145441792, 83.63851688121046),
    "Rayachoti": (14.034547749682826, 78.742083666878),
    "Srikakulam": (18.332998428840373, 83.89376887784483),
    "Tadepalligudem": (16.82770902482079, 81.51346848504355),
    "Tanuku": (16.7617518180491, 81.69351634411872),
    "Tekkali": (18.615105683924146, 84.23759630935115),
    "Tirupati": (13.630525970219104, 79.43312444294216),
    "Vijayawada": (16.54876440484886, 80.59734283867702),
    "Vishakhapatnam": (17.747984366400427, 83.23257133211204),
    "Vizianagaram": (18.109167935851023, 83.42229082243806),

    "Armoor": (18.792473253625822, 78.32254664442193),
    "Bhupalapalli": (18.442519350221367, 79.86822646683756),
    "Chityala": (17.22977776015629, 79.12541949564445),
    "Godavarikhani": (18.741991861536032, 79.49418602451554),
    "Kalwakurthy": (16.67864083988364, 78.50133591097361),
    "Karimnagar": (18.430321506643413, 79.15011341716888),
    "Khammam": (17.269464274174183, 80.13766810913936),
    "Kothagudem": (17.51920550526203, 80.59158883909069),
    "Manikonda": (17.396511664317654, 78.38291785331896),
    "Mahabubabad": (17.59025659661367, 79.9971944981834),
    "Miryalaguda": (16.860059667379403, 79.58510232918856),
    "Moosapet": (17.46064322153437, 78.40536309564978),
    "Mulugu": (18.195388795929862, 79.95570776867908),
    "Nacharam": (17.438601868927055, 78.56390017228105),
    "Shamshabad": (17.307865771582676, 78.44992922600534),
    "Siddipet": (18.1065813253641, 78.84883346682949),
    "Warangal": (17.986971357054014, 79.55732535333266),

    "HBR Layout": (13.030519975373549, 77.62858132439591),
    "Mysoru": (12.296474387186363, 76.71141768020689),
    "JP Nagar": (12.882591888718595, 77.5752955474698),
    "Calicut": (11.241317574281277, 75.83523669002147),
    "Ernakulam": (9.914390509578853, 76.31560833784253),
    "Kannur": (11.888873806404025, 75.36464689554171),
    "Thrissur": (10.634209487043492, 76.22012375319369),
    "Chennai": (13.13753856804519, 80.18245406672715),
    "Madurai": (9.97647748208029, 78.18008722853583),
    "Salem": (11.703220151654492, 78.10439011088026),
    "Kundrathur": (12.980456081796452, 80.1020575243951),
    "Goregaon": (19.155128345990637, 72.84218846685516),
    "Kalyan Thane": (19.237450912256573, 73.12065635336323),
    "Pune": (18.485438324133646, 73.80932935334464),
    "Delhi": (28.543731806879574, 77.0344527198104),
    "Bhubaneswar": (20.328438063126278, 85.8821310092148),
    "Patna": (25.56115779923162, 85.18168835166514),

    # Two separate company depots.
    # Existing NAYANDALLI branch is intentionally untouched.
    "Nayandahalli Depot - 1": (
        12.94485322667303,
        77.49712559555913,
    ),
    "Nayandahalli Depot - 2": (
        12.945131819664507,
        77.4972055667238,
    ),
}


# ---------------------------------------------------------
# EXISTING DATABASE BRANCH NAME -> COMPANY DEPOT
# ---------------------------------------------------------

EXISTING_BRANCH_MAP = {
    "KALYAN": "Kalyan Thane",
    "MADURAI": "Madurai",
    "LUCKNOW": None,
    "PATNA": "Patna",
    "NACHARAM": "Nacharam",
    "SALEM": "Salem",
    "KANNUR": "Kannur",
    "HBR": "HBR Layout",
    "THADEPALLIGUDEM": "Tadepalligudem",
    "GAJUWAKA": "Gajuwaka",
    "MOOSAPETE": "Moosapet",
    "VISHAKAPATMNUM": "Vishakhapatnam",
    "KAMMAM": "Khammam",
    "JANGAREDDYGUDEM": "Jangareddygudem",
    "TANUKU": "Tanuku",
    "AMALAPURAM": "Amalapuram",
    "WARRANGAL": "Warangal",
    "CHITIYALA": "Chityala",
    "TIRUPATHI": "Tirupati",
    "KOTHAGUDEM": "Kothagudem",
    "NELLORE": "Nellore",
    "RAJAM": "Rajam",
    "SIDDIPETE": "Siddipet",
    "MANIKONDA": "Manikonda",
    "JP NAGAR": "JP Nagar",
    "BHUPALPALLY": "Bhupalapalli",
    "VIJIYANAGARAM": "Vizianagaram",
    "MYSORE": "Mysoru",
    "ANAKAPALLI": "Anakapalle",
    "BHIMAVARAM": "Bhimavaram",
    "GOREGAON": "Goregaon",
    "MAJESTIC": None,
    "MADHURAVADA": "Madhurawada",
    "CHENNAI": "Chennai",
    "PALASA": "Palasa",
    "YESHWANTHPURA": None,
    "SRIKAKULAM": "Srikakulam",
    "VIJAYAWADA": "Vijayawada",
    "ERNAKULAM": "Ernakulam",
    "MACHALIPATNUM": "Machilipatnam",
    "ONGLE": "Ongole",
    "PARVATHIPURAM": "Parvathipuram",
    "KAKINADA": "Kakinada",
    "CALICUT": "Calicut",
    "RAJAMANDRY": "Rajahmundry",
    "SHAMSHABAD": "Shamshabad",
    "KARIMNAGAR": "Karimnagar",
    "ARMOOR": "Armoor",
    "GODAVARIKHANI": "Godavarikhani",
    "JAGAMPETE": "Jaggampeta",
    "GUDIWADA": "Gudivada",
    "NERIYALAGUDA": "Miryalaguda",
    "CHEBROLU": "Chebrolu",
    "TEKKALI": "Tekkali",
    "PUNE": "Pune",
}


# ---------------------------------------------------------
# SKIP THESE COMPANY ENTRIES
# ---------------------------------------------------------

SKIP = {
    "Anantapur",
    "Bobbili",
    "Davanagere",
    "Lucknow",
}


def normalize(value):
    if not value:
        return ""

    return (
        str(value)
        .strip()
        .upper()
        .replace("-", " ")
        .replace("_", " ")
        .replace("  ", " ")
    )


def main():
    app = create_app()

    with app.app_context():

        created = []
        updated = []
        skipped = []

        try:
            # ---------------------------------------------
            # 1. UPDATE EXISTING BRANCHES
            # ---------------------------------------------

            for branch in Branch.query.all():

                db_name = normalize(branch.branch_name)

                if db_name not in EXISTING_BRANCH_MAP:
                    continue

                depot_name = EXISTING_BRANCH_MAP[db_name]

                if not depot_name:
                    skipped.append(
                        f"{branch.branch_id} | "
                        f"{branch.branch_name} | "
                        f"No company GPS mapping"
                    )
                    continue

                coordinates = DEPOTS.get(depot_name)

                if not coordinates:
                    skipped.append(
                        f"{branch.branch_id} | "
                        f"{branch.branch_name} | "
                        f"GPS unavailable"
                    )
                    continue

                latitude, longitude = coordinates

                branch.latitude = latitude
                branch.longitude = longitude
                branch.allowed_radius = 100

                updated.append(
                    f"{branch.branch_id} | "
                    f"{branch.branch_name} | "
                    f"{latitude}, {longitude}"
                )

            # ---------------------------------------------
            # 2. EXISTING BRANCH NAMES AFTER NORMALIZATION
            # ---------------------------------------------

            existing_names = {
                normalize(branch.branch_name)
                for branch in Branch.query.all()
            }

            # ---------------------------------------------
            # 3. CREATE MISSING COMPANY GPS BRANCHES
            # ---------------------------------------------

            for depot_name, coordinates in DEPOTS.items():

                if depot_name in SKIP:
                    continue

                latitude, longitude = coordinates

                normalized_depot = normalize(depot_name)

                # Never create duplicate branch.
                if normalized_depot in existing_names:
                    continue

                branch = Branch(
                    branch_name=depot_name,
                    latitude=latitude,
                    longitude=longitude,
                    allowed_radius=100,
                )

                db.session.add(branch)

                created.append(
                    f"{depot_name} | "
                    f"{latitude}, {longitude}"
                )

                existing_names.add(normalized_depot)

            # ---------------------------------------------
            # 4. COMMIT EVERYTHING TOGETHER
            # ---------------------------------------------

            db.session.commit()

            print("\n========================================")
            print("DEPOT BRANCH UPDATE COMPLETED")
            print("========================================\n")

            print("UPDATED EXISTING BRANCHES:")
            for item in updated:
                print("  UPDATED:", item)

            print("\nCREATED NEW BRANCHES:")
            for item in created:
                print("  CREATED:", item)

            print("\nSKIPPED:")
            for item in skipped:
                print("  SKIPPED:", item)

            print("\n========================================")
            print(f"UPDATED : {len(updated)}")
            print(f"CREATED : {len(created)}")
            print(f"SKIPPED : {len(skipped)}")
            print("========================================")

            print(
                "\nIMPORTANT:"
                "\nNo employee records were modified."
                "\nNo employee branch_id values were changed."
                "\nNayandahalli existing branch was left untouched."
            )

        except Exception as exc:

            db.session.rollback()

            print("\n========================================")
            print("UPDATE FAILED")
            print("========================================")
            print(exc)
            print("\nDatabase transaction rolled back.")
            raise


if __name__ == "__main__":
    main()