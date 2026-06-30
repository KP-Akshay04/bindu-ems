import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest } from "../services/api";
import api from "../services/api";

const AuthContext = createContext(null);

// Centralized roles
export const ROLES = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  EMPLOYEE: "Employee",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("bindu_user");

    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem("bindu_user");
      }
    }

    setHydrated(true);
  }, []);

  const persist = (u) => {
    localStorage.setItem(
      "bindu_user",
      JSON.stringify(u)
    );

    setUser(u);
  };

  const login = async ({
    employee_id,
    password,
    role,
  }) => {
    const data = await loginRequest({
      employee_id,
      password,
      role,
    });

    const token =
      data.token ||
      data.access_token ||
      data.jwt ||
      null;

    if (token) {
      localStorage.setItem(
        "bindu_token",
        token
      );
    }

    persist(data);

    return data;
  };

  const refreshUser = async () => {
    if (!user?.employee_id) return;

    try {
      const list = await api
        .get("/api/employees")
        .then((r) => r.data);

      const fresh = list.find(
        (e) =>
          String(e.employee_id) ===
          String(user.employee_id)
      );

      if (fresh) {
        persist({
          ...user,
          ...fresh,
        });
      }
    } catch (err) {
      console.error(
        "refreshUser failed:",
        err
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("bindu_token");
    localStorage.removeItem("bindu_user");

    setUser(null);
  };

  // Role Helpers
  const isSuperAdmin =
    user?.role === ROLES.SUPER_ADMIN;

  const isHR =
    user?.role === ROLES.HR;

  const isEmployee =
    user?.role === ROLES.EMPLOYEE;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: persist,

        login,
        logout,
        refreshUser,

        hydrated,

        ROLES,

        isSuperAdmin,
        isHR,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>"
    );
  }

  return ctx;
};