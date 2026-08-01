import api from "./api";

export const validateExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    "/api/import/validate",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const importEmployees = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    "/api/import/employees",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};