import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({
  allowedRoles,
  children,
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles || !Array.isArray(allowedRoles)) {
    console.error("allowedRoles prop missing");
    return <Navigate to="/dashboard" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600">
            Access Denied
          </h2>

          <p className="mt-2 text-slate-500">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}