from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)

    # Allow Vite frontend
    CORS(
        app,
        resources={r"/api/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True
    )

    app.config.from_object("config.Config")

    db.init_app(app)
    migrate.init_app(app, db)

    from app.models.branch import Branch
    from app.models.employee import Employee
    from app.models.department import Department
    from app.models.leave_request import LeaveRequest
    from app.models.payroll import Payroll
    from app.models.attendance import Attendance

    from app.routes.branch_routes import branch_bp
    from app.routes.department_routes import department_bp
    from app.routes.employee_routes import employee_bp
    from app.routes.leave_routes import leave_bp
    from app.routes.payroll_routes import payroll_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.auth_routes import auth_bp

    app.register_blueprint(department_bp)
    app.register_blueprint(branch_bp)
    app.register_blueprint(employee_bp)
    app.register_blueprint(leave_bp)
    app.register_blueprint(payroll_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)

    return app