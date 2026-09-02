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
import MyAttendance from "./pages/MyAttendance";
import MyLeaves from "./pages/MyLeaves";
import MyPayroll from "./pages/MyPayroll";
import DepotManagers from "./pages/DepotManagers";
import AccessControl from "./pages/AccessControl";


const MANAGEMENT_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.HR,
];

const ALL_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.HR,
  ROLES.EMPLOYEE,
];


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* =================================================
              ROOT REDIRECT
          ================================================= */}
          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


          {/* =================================================
              LOGIN
          ================================================= */}
          <Route
            path="/login"
            element={<Login />}
          />


          {/* =================================================
              PROTECTED APPLICATION AREA
          ================================================= */}
          <Route
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >

            {/* =================================================
                DASHBOARD
            ================================================= */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />


            {/* =================================================
                MANAGEMENT: EMPLOYEES
            ================================================= */}
            <Route
              path="/employees"
              element={
                <RoleProtectedRoute
                  allowedRoles={MANAGEMENT_ROLES}
                  permissionKey="hr_depot_employees"
                >
                  <Employees />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                MANAGEMENT: ATTENDANCE
            ================================================= */}
            <Route
              path="/attendance"
              element={
                <RoleProtectedRoute
                  allowedRoles={MANAGEMENT_ROLES}
                  permissionKey="hr_attendance"
                >
                  <Attendance />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                PERSONAL: MY ATTENDANCE
                All authenticated roles allowed.
            ================================================= */}
            <Route
              path="/my-attendance"
              element={
                <RoleProtectedRoute
                  allowedRoles={ALL_ROLES}
                >
                  <MyAttendance />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                MANAGEMENT: LEAVES
            ================================================= */}
            <Route
              path="/leaves"
              element={
                <RoleProtectedRoute
                  allowedRoles={MANAGEMENT_ROLES}
                  permissionKey="hr_leaves"
                >
                  <Leaves />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                PERSONAL: MY LEAVES
                All authenticated roles allowed.
            ================================================= */}
            <Route
              path="/my-leaves"
              element={
                <RoleProtectedRoute
                  allowedRoles={ALL_ROLES}
                >
                  <MyLeaves />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                MANAGEMENT: PAYROLL
            ================================================= */}
            <Route
              path="/payroll"
              element={
                <RoleProtectedRoute
                  allowedRoles={MANAGEMENT_ROLES}
                  permissionKey="hr_payroll"
                >
                  <Payroll />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                PERSONAL: MY PAYROLL
                All authenticated roles allowed.
            ================================================= */}
            <Route
              path="/my-payroll"
              element={
                <RoleProtectedRoute
                  allowedRoles={ALL_ROLES}
                >
                  <MyPayroll />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                DEPOT MANAGERS
            ================================================= */}
            <Route
              path="/depot-managers"
              element={
                <RoleProtectedRoute
                  allowedRoles={MANAGEMENT_ROLES}
                  permissionKey="hr_depot_managers"
                >
                  <DepotManagers />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                SHIFT MANAGEMENT
            ================================================= */}
            <Route
              path="/shifts"
              element={
                <RoleProtectedRoute
                  allowedRoles={MANAGEMENT_ROLES}
                  permissionKey="hr_shifts"
                >
                  <Shifts />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                ANNOUNCEMENTS
                All authenticated roles can VIEW.
                Backend controls create/delete.
            ================================================= */}
            <Route
              path="/announcements"
              element={
                <RoleProtectedRoute
                  allowedRoles={ALL_ROLES}
                >
                  <Announcements />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                PROFILE
            ================================================= */}
            <Route
              path="/profile"
              element={
                <RoleProtectedRoute
                  allowedRoles={ALL_ROLES}
                >
                  <Profile />
                </RoleProtectedRoute>
              }
            />


            {/* =================================================
                SETTINGS
                Super Admin only.
            ================================================= */}
            <Route
              path="/settings"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    ROLES.SUPER_ADMIN
                  ]}
                >
                  <Settings />
                </RoleProtectedRoute>
              }
            />

          </Route>


          {/* =================================================
              ACCESS CONTROL
              SUPER ADMIN ONLY
          ================================================= */}
          <Route
            path="/access-control"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.SUPER_ADMIN
                ]}
              >
                <AccessControl />
              </RoleProtectedRoute>
            }
          />


          {/* =================================================
              UNKNOWN ROUTE
          ================================================= */}
          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}