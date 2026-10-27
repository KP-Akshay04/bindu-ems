import os
from dotenv import load_dotenv

load_dotenv()


def get_employee_code_set(name):
    return {
        employee_code.strip().upper()
        for employee_code in os.getenv(name, "").split(",")
        if employee_code.strip()
    }


def get_positive_float(name, default):
    try:
        value = float(os.getenv(name, default))
    except (TypeError, ValueError):
        return default

    return value if value > 0 else default


def get_positive_int(name, default):
    try:
        value = int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default

    return value if value > 0 else default


class Config:

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://bindu:Bindu123@localhost/bindu_ems"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY"
    )

    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 8

    GEOFENCE_BYPASS_EMPLOYEE_CODES = get_employee_code_set(
        "GEOFENCE_BYPASS_EMPLOYEE_CODES"
    )

    GEOFENCE_MAX_ACCURACY_METERS = get_positive_float(
        "GEOFENCE_MAX_ACCURACY_METERS",
        50,
    )

    LOCATION_CHALLENGE_TTL_SECONDS = get_positive_int(
        "LOCATION_CHALLENGE_TTL_SECONDS",
        120,
    )

    LOCATION_CHALLENGE_MAX_ATTEMPTS = get_positive_int(
        "LOCATION_CHALLENGE_MAX_ATTEMPTS",
        5,
    )

    LOCATION_CHALLENGE_MAX_PER_WINDOW = get_positive_int(
        "LOCATION_CHALLENGE_MAX_PER_WINDOW",
        3,
    )

    LOCATION_CHALLENGE_RATE_WINDOW_MINUTES = get_positive_int(
        "LOCATION_CHALLENGE_RATE_WINDOW_MINUTES",
        10,
    )

    PUBLIC_APP_URL = os.getenv(
        "PUBLIC_APP_URL",
        "",
    ).strip().rstrip("/")
