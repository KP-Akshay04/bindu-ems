import api from "./api";

export const getDesignations = () =>
  api.get("/api/designations");

export const createDesignation = (data) =>
  api.post("/api/designations", data);

export const updateDesignation = (id, data) =>
  api.put(`/api/designations/${id}`, data);

export const deleteDesignation = (id) =>
  api.delete(`/api/designations/${id}`);