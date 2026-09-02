import api from "./api";

export const getBranches = () =>
  api.get("/api/branches");

export const createBranch = (data) =>
  api.post("/api/branches", data);

export const updateBranch = (id, data) =>
  api.put(`/api/branches/${id}`, data);

export const deleteBranch = (id) =>
  api.delete(`/api/branches/${id}`);