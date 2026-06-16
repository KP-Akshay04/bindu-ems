import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Announcements from "./pages/Announcements";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees"element={<RoleProtectedRoute allowedRoles={["Super Admin", "HR Admin"]}>
      <Employees />
    </RoleProtectedRoute>
  }
/>
            <Route path="/attendance"element={<RoleProtectedRoute allowedRoles={["Super Admin","HR Admin","Manager","Employee",]}>
      <Attendance />
    </RoleProtectedRoute>
  }
/>
            <Route path="/leaves"element={<RoleProtectedRoute allowedRoles={["Super Admin","HR Admin","Manager","Employee",]}>
      <Leaves />
    </RoleProtectedRoute>
  }
/>
            <Route path="/payroll"element={<RoleProtectedRoute allowedRoles={["Super Admin","HR Admin","Employee",]}>
      <Payroll />
    </RoleProtectedRoute>
  }
/>

            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/announcements" element={<Announcements />} />

          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}