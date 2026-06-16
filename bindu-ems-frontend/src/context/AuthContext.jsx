import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest } from "../services/api";

const AuthContext = createContext(null);

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

  const login = async ({ employee_id, password, role }) => {
    const data = await loginRequest({ employee_id, password, role });
    // accept common Flask response shapes
    const token = data.token || data.access_token || data.jwt || null;
    const u =
  data.user ||
  data.employee ||
  (data.employee_id ? data : null) || {
    employee_id,
    role: data.role || role,
    name: data.name || employee_id,
  };
    if (token) localStorage.setItem("bindu_token", token);
    localStorage.setItem("bindu_user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem("bindu_token");
    localStorage.removeItem("bindu_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};