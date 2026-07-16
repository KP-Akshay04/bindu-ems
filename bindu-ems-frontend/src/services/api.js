import axios from "axios";

const BASE_URL = "";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bindu_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralised error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // token expired or invalid
      localStorage.removeItem("bindu_token");
      localStorage.removeItem("bindu_user");
    }
    return Promise.reject(err);
  }
);

// ---- AUTH ----
export const loginRequest = (payload) =>
  api.post("/api/auth/login", payload).then((r) => r.data);

// ---- EMPLOYEES ----
export const fetchEmployees = () =>
  api.get("/api/employees").then((r) => r.data);

export const createEmployee = (payload) =>
  api.post("/api/employees", payload).then((r) => r.data);

export const updateEmployee = (id, payload) =>
  api.put(`/api/employees/${id}`, payload).then((r) => r.data);

export const deactivateEmployee = (id) =>
  api.put(`/api/employees/${id}/deactivate`).then((r) => r.data);


// ---- ATTENDANCE ----
export const fetchAttendance = (params = {}) =>
  api.get("/api/attendance", { params }).then((r) => r.data);

export const attendanceCheckIn = (employeeId) =>
  api.post("/api/attendance/login", { employee_id: employeeId }).then((r) => r.data);

export const attendanceLunchOut = (payload) =>
  api.post("/api/attendance/lunch-out", payload).then((r) => r.data);

export const attendanceLunchIn = (payload) =>
  api.post("/api/attendance/lunch-in", payload).then((r) => r.data);

export const attendanceCheckOut = (employeeId) =>
  api.put(`/api/attendance/logout/${employeeId}`).then((r) => r.data);

// Keep the old name as alias if your Dashboard.jsx still imports it
export const attendanceLogin = attendanceCheckIn;

// ---- LEAVES ----

export const fetchLeaves = (params = {}) =>
  api.get("/api/leaves", { params }).then((r) => r.data);

export const fetchLeaveById = (id) =>
  api.get(`/api/leaves/${id}`).then((r) => r.data);

export const createLeave = (payload) =>
  api.post("/api/leaves/apply", payload).then((r) => r.data);

export const approveLeave = (id) =>
  api.put(`/api/leaves/${id}/approve`).then((r) => r.data);

export const rejectLeave = (id) =>
  api.put(`/api/leaves/${id}/reject`).then((r) => r.data);

export const cancelLeave = (id) =>
  api.put(`/api/leaves/${id}/cancel`).then((r) => r.data);

export const fetchLeaveSummary = () =>
  api.get("/api/leaves/summary").then((r) => r.data);

export const fetchLeaveBalance = (employeeId) =>
  api.get(`/api/leaves/balance/${employeeId}`).then((r) => r.data);

export const fetchLeaveTypes = () =>
  api.get("/api/leaves/types").then((r) => r.data);

export const searchLeaves = (params = {}) =>
  api.get("/api/leaves/search", { params }).then((r) => r.data);

// ---- PAYROLL ----
export const fetchPayroll = (params = {}) =>
  api.get("/api/payroll", { params }).then((r) => r.data);

export const createPayroll = (payload) =>
  api.post("/api/payroll", payload).then((r) => r.data);

export const markPayrollPaid = (id) =>
  api.put(`/api/payroll/${id}/pay`).then((r) => r.data);

// ---- PASSWORD CHANGE ----
export const changePassword = (id,payload) =>
  api.put(`/api/employees/${id}/password`,payload).then((r) => r.data);


// ---- ANNOUNCEMENTS --- 
export const fetchAnnouncements = () =>
  api.get("/api/announcements").then((r) => r.data);

export const createAnnouncement = (payload) =>
  api.post("/api/announcements", payload).then((r) => r.data);

export const deleteAnnouncement = (id) =>
  api.delete(`/api/announcements/${id}`).then((r) => r.data);

export default api;
