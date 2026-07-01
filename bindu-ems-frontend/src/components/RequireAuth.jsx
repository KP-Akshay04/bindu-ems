import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = String(user.role || "")
    .trim()
    .toLowerCase();

  const normalizedRoles = allowedRoles.map((r) =>
    String(r).trim().toLowerCase()
  );

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-red-600">
          Access Denied
        </h2>

        <p className="mt-2 text-slate-500">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return children;
