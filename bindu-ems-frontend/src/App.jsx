import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ROLES } from "./context/AuthContext";

import RequireAuth from "./components/RequireAuth";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import Shifts from "./pages/Shifts";
import Announcements from "./pages/Announcements";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

const MANAGEMENT_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.HR,
];

const ALL_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.HR,
  ROLES.EMPLOYEE,
];

console.log("MANAGEMENT_ROLES =", MANAGEMENT_ROLES);
console.log("ALL_ROLES =", ALL_ROLES);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Redirect */}
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          {/* Login */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* Protected Area */}
          <Route
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* Employee Management */}
            <Route
              path="/employees"
              element={
                <RoleProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                  <Employees />
                </RoleProtectedRoute>
              }
            />

            {/* Attendance */}
            <Route
              path="/attendance"
              element={
                <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                  <Attendance />
                </RoleProtectedRoute>
              }
            />

            {/* Leave Management */}
            <Route
              path="/leaves"
              element={
                <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                  <Leaves />
                </RoleProtectedRoute>
              }
            />

            {/* Payroll */}
            <Route
              path="/payroll"
              element={
                <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                  <Payroll />
                </RoleProtectedRoute>
              }
            />

            {/* Shift Management */}
            <Route
              path="/shifts"
              element={
                <RoleProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                  <Shifts />
                </RoleProtectedRoute>
              }
            />

            {/* Announcements */}
            <Route
              path="/announcements"
              element={
                <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                  <Announcements />
                </RoleProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                  <Profile />
                </RoleProtectedRoute>
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <RoleProtectedRoute
                  allowedRoles={[ROLES.SUPER_ADMIN]}
                >
                  <Settings />
                </RoleProtectedRoute>
              }
            />
          </Route>

          {/* Unknown Route */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}