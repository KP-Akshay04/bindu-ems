import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const { user } = useAuth();

  console.log("========== ROLE CHECK ==========");
  console.log("User:", user);
  console.log("User Role:", user?.role);
  console.log("Allowed Roles:", allowedRoles);
  console.log(
    "Includes:",
    allowedRoles.includes(user?.role)
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">
          Access Denied
        </h2>

        <p className="mt-2 text-gray-600">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return children;
}