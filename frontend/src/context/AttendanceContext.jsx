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
import {
  formatGeofenceError,
  getCurrentLocation,
  isGeofenceBypassed,
} from "../utils/location";

const AttendanceContext = createContext(null);

// ---------------------------------------------------------
// TODAY
// ---------------------------------------------------------

const todayISO = () =>
  new Date().toISOString().split("T")[0];

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

        const gpsLocation = isGeofenceBypassed(
          user?.employee_code
        )
          ? null
          : await getCurrentLocation();

        // -----------------------------------------------
        // Send employee ID + GPS to backend
        // -----------------------------------------------

        await attendanceCheckIn({
          employee_id: empId,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
          accuracy: gpsLocation?.accuracy,
        });

        // -----------------------------------------------
        // Refresh today's attendance
        // -----------------------------------------------

        await refresh();
      } catch (err) {
        const message = formatGeofenceError(err);

        setError(message);

        throw err;
      }
    },
    [empId, refresh, user?.employee_code]
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
