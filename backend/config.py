import os
from dotenv import load_dotenv

load_dotenv()


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