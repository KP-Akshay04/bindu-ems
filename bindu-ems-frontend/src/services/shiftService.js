import api from "./api";

export const getShifts = () =>
  api.get("/api/shifts");

export const createShift = (data) =>
  api.post("/api/shifts", data);

export const updateShift = (id, data) =>
  api.put(`/api/shifts/${id}`, data);

export const deleteShift = (id) =>
  api.delete(`/api/shifts/${id}`);