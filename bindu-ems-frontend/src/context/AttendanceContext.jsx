import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
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

const todayISO = () => new Date().toISOString().split("T")[0];

export function AttendanceProvider({ children }) {
  const { user } = useAuth();
  const empId = user?.employee_id ?? null;

  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAttendance({ employee_id: empId });
      const list = extractList(data, "attendance");
      const today = todayISO();
      const record =
        list.find((a) => String(a.attendance_date).slice(0, 10) === today) || null;
      setTodayRecord(record);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [empId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checkIn = useCallback(async () => {
    if (!empId) throw new Error("No employee id");
    await attendanceCheckIn(empId);
    await refresh();
  }, [empId, refresh]);

  const lunchOut = useCallback(async () => {
    await attendanceLunchOut(empId);
    await refresh();
  }, [empId, refresh]);

  const lunchIn = useCallback(async () => {
    await attendanceLunchIn(empId);
    await refresh();
  }, [empId, refresh]);

  const checkOut = useCallback(async () => {
    await attendanceCheckOut(empId);
    await refresh();
  }, [empId, refresh]);

  const isOnShift = useMemo(() => {
    if (!todayRecord) return false;
    const s = String(todayRecord.status ?? "").toLowerCase();
    return s === "working" || s === "lunch break";
  }, [todayRecord]);

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

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export const useAttendance = () => {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within <AttendanceProvider>");
  return ctx;
};