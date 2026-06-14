import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export const attendanceLogin = (payload) =>
  api.post("/api/attendance/login", payload).then((r) => r.data);

// ---- LEAVES ----
export const fetchLeaves = (params = {}) =>
  api.get("/api/leaves", { params }).then((r) => r.data);

export const createLeave = (payload) =>
  api.post("/api/leaves", payload).then((r) => r.data);

// ---- PAYROLL ----
export const fetchPayroll = (params = {}) =>
  api.get("/api/payroll", { params }).then((r) => r.data);

export default api;