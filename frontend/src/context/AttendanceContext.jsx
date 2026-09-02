import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import { useAuth } from "./AuthContext";

import {
  fetchAttendance,
  attendanceCheckIn,
  attendanceLunchOut,
  attendanceLunchIn,
  attendanceCheckOut,
} from "../services/api";

import { extractList } from "../utils/format";

const AttendanceContext = createContext(null);

// ---------------------------------------------------------
// TODAY
// ---------------------------------------------------------

const todayISO = () =>
  new Date().toISOString().split("T")[0];

// ---------------------------------------------------------
// GET CURRENT GPS LOCATION
// ---------------------------------------------------------

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "Geolocation is not supported by this browser."
        )
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number"
        ) {
          reject(
            new Error(
              "Unable to obtain a valid GPS location."
            )
          );

          return;
        }

        resolve({
          latitude,
          longitude,
        });
      },

      (error) => {
        let message =
          "Unable to get your current GPS location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location permission was denied. Please allow location access and try again.";
            break;

          case error.POSITION_UNAVAILABLE:
            message =
              "Your current location is unavailable. Please check your device location settings.";
            break;

          case error.TIMEOUT:
            message =
              "GPS location request timed out. Please try again.";
            break;

          default:
            message =
              "Unable to get your current GPS location.";
        }

        reject(new Error(message));
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

// ---------------------------------------------------------
// ATTENDANCE PROVIDER
// ---------------------------------------------------------

export function AttendanceProvider({
  children,
}) {
  const { user } = useAuth();

  const empId =
    user?.employee_id ?? null;

  const [todayRecord, setTodayRecord] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  // -------------------------------------------------------
  // REFRESH ATTENDANCE
  // -------------------------------------------------------

  const refresh = useCallback(
    async () => {
      if (!empId) return;

      setLoading(true);
      setError(null);

      try {
        const data =
          await fetchAttendance({
            employee_id: empId,
          });

        const list =
          extractList(
            data,
            "attendance"
          );

        const today =
          todayISO();

        const record =
          list.find(
            (a) =>
              String(
                a.attendance_date
              ).slice(0, 10) ===
              today
          ) || null;

        setTodayRecord(record);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load attendance."
        );
      } finally {
        setLoading(false);
      }
    },
    [empId]
  );

  // -------------------------------------------------------
  // INITIAL REFRESH
  // -------------------------------------------------------

  useEffect(() => {
    refresh();
  }, [refresh]);

  // -------------------------------------------------------
  // CHECK IN WITH GPS
  // -------------------------------------------------------

  const checkIn = useCallback(
    async () => {
      if (!empId) {
        throw new Error(
          "No employee id."
        );
      }

      setError(null);

      try {
        // -----------------------------------------------
        // Get current browser GPS position
        // -----------------------------------------------

        const {
          latitude,
          longitude,
        } = await getCurrentLocation();

        console.log(
          "ATTENDANCE GPS:",
          {
            latitude,
            longitude,
          }
        );

        // -----------------------------------------------
        // Send employee ID + GPS to backend
        // -----------------------------------------------

        await attendanceCheckIn({
          employee_id: empId,
          latitude,
          longitude,
        });

        // -----------------------------------------------
        // Refresh today's attendance
        // -----------------------------------------------

        await refresh();
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to check in.";

        setError(message);

        throw err;
      }
    },
    [empId, refresh]
  );

  // -------------------------------------------------------
  // LUNCH OUT
  // -------------------------------------------------------

  const lunchOut = useCallback(
    async () => {
      if (!empId) {
        throw new Error(
          "No employee id."
        );
      }

      setError(null);

      try {
        await attendanceLunchOut({
          employee_id: empId,
        });

        await refresh();
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to start lunch break."
        );

        throw err;
      }
    },
    [empId, refresh]
  );

  // -------------------------------------------------------
  // LUNCH IN
  // -------------------------------------------------------

  const lunchIn = useCallback(
    async () => {
      if (!empId) {
        throw new Error(
          "No employee id."
        );
      }

      setError(null);

      try {
        await attendanceLunchIn({
          employee_id: empId,
        });

        await refresh();
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to return from lunch."
        );

        throw err;
      }
    },
    [empId, refresh]
  );

  // -------------------------------------------------------
  // CHECK OUT
  // -------------------------------------------------------

  const checkOut = useCallback(
    async () => {
      if (!empId) {
        throw new Error(
          "No employee id."
        );
      }

      setError(null);

      try {
        await attendanceCheckOut(
          empId
        );

        await refresh();
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to check out."
        );

        throw err;
      }
    },
    [empId, refresh]
  );

  // -------------------------------------------------------
  // ACTIVE SHIFT STATE
  // -------------------------------------------------------

  const isOnShift = useMemo(() => {
    if (!todayRecord) {
      return false;
    }

    const status =
      String(
        todayRecord.status ?? ""
      ).toLowerCase();

    return (
      status === "working" ||
      status === "lunch break"
    );
  }, [todayRecord]);

  // -------------------------------------------------------
  // CONTEXT VALUE
  // -------------------------------------------------------

  const value = {
    todayRecord,

    loading,

    error,

    isOnShift,

    refresh,

    checkIn,

    lunchOut,

    lunchIn,

    checkOut,
  };

  return (
    <AttendanceContext.Provider
      value={value}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

// ---------------------------------------------------------
// ATTENDANCE HOOK
// ---------------------------------------------------------

export const useAttendance = () => {
  const ctx =
    useContext(
      AttendanceContext
    );

  if (!ctx) {
    throw new Error(
      "useAttendance must be used within <AttendanceProvider>"
    );
  }

  return ctx;
};