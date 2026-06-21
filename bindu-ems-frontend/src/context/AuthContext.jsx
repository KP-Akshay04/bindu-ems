import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest } from "../services/api";
import api from "../services/api";

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

  const persist = (u) => {
    localStorage.setItem("bindu_user", JSON.stringify(u));
    setUser(u);
  };

  const login = async ({
  employee_id,
  password,
  role,
}) => {

  const data =
    await loginRequest({
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

  // Re-fetch current user from /api/employees so latest fields (like photo) are loaded
  const refreshUser = async () => {
    if (!user?.employee_id) return;
    try {
      const list = await api.get("/api/employees").then((r) => r.data);
      const fresh = list.find(
        (e) => String(e.employee_id) === String(user.employee_id)
      );
      if (fresh) {
        const merged = { ...user, ...fresh };
        persist(merged);
      }
    } catch (err) {
      console.error("refreshUser failed:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("bindu_token");
    localStorage.removeItem("bindu_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: persist, login, logout, refreshUser, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};