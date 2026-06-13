import "./../styles/login.css";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Droplets,
  Users,
  CalendarDays,
  IndianRupee,
  MapPin,
} from "lucide-react";

export default function Login() {
  const [role, setRole] = useState("hr");

  return (
    <div className="login-wrapper">

      {/* Background Effects */}
      <div className="water-bg">
        <div className="bubble b1"></div>
        <div className="bubble b2"></div>
        <div className="bubble b3"></div>
      </div>

      {/* Left Panel */}
      <motion.div
        className="left-panel"
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="logo-section">
          <Droplets size={52} />

          <div>
            <h2>BINDU EMS</h2>
            <span>WATER COMPANY</span>
          </div>
        </div>

        <div className="tag">
          ENTERPRISE WORKFORCE PLATFORM
        </div>

        <h1>
          Workforce,
          <br />
          <span>precisely managed.</span>
        </h1>

        <p className="description">
          Unified workforce platform for attendance,
          payroll, leave management and workforce
          operations with complete transparency.
        </p>

        <div className="feature-grid">

          <div className="feature-card">
            <Users size={24} />
            <span>Attendance</span>
          </div>

          <div className="feature-card">
            <CalendarDays size={24} />
            <span>Leave</span>
          </div>

          <div className="feature-card">
            <IndianRupee size={24} />
            <span>Payroll</span>
          </div>

          <div className="feature-card">
            <MapPin size={24} />
            <span>Field Tracking</span>
          </div>

        </div>

        <div className="stats-bar">

          <div>
            <h3>500+</h3>
            <span>Employees</span>
          </div>

          <div>
            <h3>12</h3>
            <span>Departments</span>
          </div>

          <div>
            <h3>99.8%</h3>
            <span>Accuracy</span>
          </div>

        </div>
      </motion.div>

      {/* Login Card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="login-logo">
          <Droplets size={28} />
        </div>

        <h2>Welcome Back</h2>

        <p>Sign in to continue</p>

        <div className="role-tabs">

          <button
            className={role === "hr" ? "active" : ""}
            onClick={() => setRole("hr")}
          >
            HR Portal
          </button>

          <button
            className={role === "manager" ? "active" : ""}
            onClick={() => setRole("manager")}
          >
            Manager Portal
          </button>

          <button
            className={role === "employee" ? "active" : ""}
            onClick={() => setRole("employee")}
          >
            Employee Portal
          </button>

        </div>

        <div className="demo-box">

          {role === "hr" && (
            <>
              <strong>Demo Credentials</strong>
              <p>Email: hr@bindu.com</p>
              <p>Password: hr123</p>
            </>
          )}

          {role === "manager" && (
            <>
              <strong>Demo Credentials</strong>
              <p>Email: manager@bindu.com</p>
              <p>Password: manager123</p>
            </>
          )}

          {role === "employee" && (
            <>
              <strong>Demo Credentials</strong>
              <p>Employee ID: EMP001</p>
              <p>Password: emp123</p>
            </>
          )}

        </div>

        <label>Employee ID</label>

        <input
          type="text"
          placeholder="Enter Employee ID"
        />

        <label>Password</label>

        <input
          type="password"
          placeholder="Enter Password"
        />

        <button className="login-btn">
          Sign In
        </button>

      </motion.div>

    </div>
  );
}