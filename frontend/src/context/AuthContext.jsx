import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { loginRequest } from "../services/api";
import api from "../services/api";

const AuthContext = createContext(null);

// ---------------------------------------------------------
// CENTRALIZED ROLES
// ---------------------------------------------------------

export const ROLES = {
  SUPER_ADMIN: "Super Admin",
  HR: "HR",
  EMPLOYEE: "Employee",
};

// ---------------------------------------------------------
// LOCAL STORAGE KEYS
// ---------------------------------------------------------

const USER_KEY = "bindu_user";
const TOKEN_KEY = "bindu_token";
const PERMISSIONS_KEY = "bindu_permissions";

// ---------------------------------------------------------
// AUTH PROVIDER
// ---------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [hydrated, setHydrated] = useState(false);

  // -------------------------------------------------------
  // PERSIST USER
  // -------------------------------------------------------

  const persist = useCallback((u) => {
    if (!u) {
      localStorage.removeItem(USER_KEY);
      setUserState(null);
      return;
    }

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(u)
    );

    setUserState(u);
  }, []);

  // -------------------------------------------------------
  // LOAD SAVED PERMISSIONS
  // -------------------------------------------------------

  const loadSavedPermissions = useCallback(() => {
    const raw =
      localStorage.getItem(
        PERMISSIONS_KEY
      );

    if (!raw) {
      setPermissions({});
      return {};
    }

    try {
      const parsed =
        JSON.parse(raw);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        setPermissions(parsed);
        return parsed;
      }

      setPermissions({});
      return {};
    } catch {
      localStorage.removeItem(
        PERMISSIONS_KEY
      );

      setPermissions({});
      return {};
    }
  }, []);

  // -------------------------------------------------------
  // FETCH CURRENT USER PERMISSIONS
  //
  // IMPORTANT:
  // This function intentionally does NOT depend on `user`.
  // The caller passes the user explicitly.
  // This prevents the hydration/render loop.
  // -------------------------------------------------------

  const refreshPermissions = useCallback(
    async (currentUser = null) => {
      if (!currentUser) {
        setPermissions({});

        localStorage.removeItem(
          PERMISSIONS_KEY
        );

        return;
      }

      // ---------------------------------------------------
      // SUPER ADMIN
      // ---------------------------------------------------

      if (
        currentUser.role ===
        ROLES.SUPER_ADMIN
      ) {
        setPermissions({});

        localStorage.removeItem(
          PERMISSIONS_KEY
        );

        return;
      }

      // ---------------------------------------------------
      // EMPLOYEE
      // ---------------------------------------------------

      if (
        currentUser.role !==
        ROLES.HR
      ) {
        setPermissions({});

        localStorage.removeItem(
          PERMISSIONS_KEY
        );

        return;
      }

      // ---------------------------------------------------
      // HR
      // ---------------------------------------------------

      try {
        const response =
          await api.get(
            "/api/access-control/my-permissions"
          );

        const data =
          response.data;

        // Backend returns:
        //
        // {
        //   success: true,
        //   role: "HR",
        //   permissions: {
        //      hr_dashboard: true,
        //      hr_attendance: true
        //   }
        // }

        const permissionMap =
          data?.permissions &&
          typeof data.permissions ===
            "object" &&
          !Array.isArray(
            data.permissions
          )
            ? data.permissions
            : {};

        setPermissions(
          permissionMap
        );

        localStorage.setItem(
          PERMISSIONS_KEY,
          JSON.stringify(
            permissionMap
          )
        );
      } catch (err) {
        console.error(
          "Failed to load user permissions:",
          err
        );

        // -------------------------------------------------
        // Backend temporarily unavailable.
        // Use previously saved permissions.
        // -------------------------------------------------

        loadSavedPermissions();
      }
    },
    [
      loadSavedPermissions,
    ]
  );

  // -------------------------------------------------------
  // INITIAL HYDRATION
  //
  // Runs ONLY once when AuthProvider starts.
  // -------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const rawUser =
        localStorage.getItem(
          USER_KEY
        );

      const token =
        localStorage.getItem(
          TOKEN_KEY
        );

      // ---------------------------------------------------
      // No saved session
      // ---------------------------------------------------

      if (!rawUser || !token) {
        localStorage.removeItem(
          PERMISSIONS_KEY
        );

        if (mounted) {
          setUserState(null);
          setPermissions({});
          setHydrated(true);
        }

        return;
      }

      // ---------------------------------------------------
      // Restore saved session
      // ---------------------------------------------------

      try {
        const savedUser =
          JSON.parse(rawUser);

        if (
          !savedUser ||
          typeof savedUser !==
            "object"
        ) {
          throw new Error(
            "Invalid saved user."
          );
        }

        if (mounted) {
          setUserState(savedUser);

          // Load cached permissions first.
          loadSavedPermissions();
        }

        // Refresh HR permissions from backend.
        await refreshPermissions(
          savedUser
        );

        if (mounted) {
          setHydrated(true);
        }
      } catch (err) {
        console.error(
          "Auth hydration failed:",
          err
        );

        localStorage.removeItem(
          USER_KEY
        );

        localStorage.removeItem(
          TOKEN_KEY
        );

        localStorage.removeItem(
          PERMISSIONS_KEY
        );

        if (mounted) {
          setUserState(null);
          setPermissions({});
          setHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [
    loadSavedPermissions,
    refreshPermissions,
  ]);

  // -------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------

  const login = async ({
    employee_id,
    password,
    role,
    latitude,
    longitude,
  }) => {
    const data =
      await loginRequest({
        employee_id,
        password,
        role,
        latitude,
        longitude,
      });

    const token =
      data.token ||
      data.access_token ||
      data.jwt ||
      null;

    if (token) {
      localStorage.setItem(
        TOKEN_KEY,
        token
      );
    }

    const userData = {
      ...data,
    };

    delete userData.access_token;
    delete userData.token;
    delete userData.jwt;

    // -----------------------------------------------------
    // Store user
    // -----------------------------------------------------

    persist(userData);

    // -----------------------------------------------------
    // Clear previous user's permissions
    // -----------------------------------------------------

    localStorage.removeItem(
      PERMISSIONS_KEY
    );

    setPermissions({});

    // -----------------------------------------------------
    // Load permissions for new user
    // -----------------------------------------------------

    await refreshPermissions(
      userData
    );

    return data;
  };

  // -------------------------------------------------------
  // REFRESH USER
  // -------------------------------------------------------

  const refreshUser = async () => {
    if (!user?.employee_id) {
      return;
    }

    try {
      const response =
        await api.get(
          "/api/employees"
        );

      const list =
        response.data;

      const fresh =
        Array.isArray(list)
          ? list.find(
              (employee) =>
                String(
                  employee.employee_id
                ) ===
                String(
                  user.employee_id
                )
            )
          : null;

      if (fresh) {
        const updatedUser = {
          ...user,
          ...fresh,
        };

        persist(updatedUser);

        await refreshPermissions(
          updatedUser
        );
      }
    } catch (err) {
      console.error(
        "refreshUser failed:",
        err
      );
    }
  };

  // -------------------------------------------------------
  // HAS PERMISSION
  // -------------------------------------------------------

  const hasPermission =
    useCallback(
      (permissionKey) => {
        // -------------------------------------------------
        // Super Admin
        // -------------------------------------------------

        if (
          user?.role ===
          ROLES.SUPER_ADMIN
        ) {
          return true;
        }

        // -------------------------------------------------
        // Employee
        // -------------------------------------------------

        if (
          user?.role !==
          ROLES.HR
        ) {
          return false;
        }

        // No specific permission requested.
        if (!permissionKey) {
          return true;
        }

        return Boolean(
          permissions[
            permissionKey
          ]
        );
      },
      [
        user?.role,
        permissions,
      ]
    );

  // -------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------

  const logout = () => {
    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    localStorage.removeItem(
      PERMISSIONS_KEY
    );

    setUserState(null);
    setPermissions({});
  };

  // -------------------------------------------------------
  // ROLE HELPERS
  // -------------------------------------------------------

  const isSuperAdmin =
    user?.role ===
    ROLES.SUPER_ADMIN;

  const isHR =
    user?.role ===
    ROLES.HR;

  const isEmployee =
    user?.role ===
    ROLES.EMPLOYEE;

  // -------------------------------------------------------
  // PROVIDER
  // -------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: persist,

        login,
        logout,

        refreshUser,
        refreshPermissions,

        hasPermission,

        permissions,

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

// ---------------------------------------------------------
// AUTH HOOK
// ---------------------------------------------------------

export const useAuth = () => {
  const ctx =
    useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>"
    );
  }

  return ctx;
};