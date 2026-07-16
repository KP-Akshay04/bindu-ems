from app import db


class Department(db.Model):
    __tablename__ = "departments"

    department_id = db.Column(
        db.Integer,
        primary_key=True
    )

    department_name = db.Column(
        db.String(100),
        nullable=False,
        unique=True
    )

    description = db.Column(
        db.String(255)
    )

    def __repr__(self):
        return f"<Department {self.department_name}>"