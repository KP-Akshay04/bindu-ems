import { useEffect, useMemo, useState } from "react";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/departmentService";

import DepartmentFormDialog from "../components/DepartmentFormDialog";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const loadDepartments = async () => {
    try {
      setLoading(true);

      const res = await getDepartments();

      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) =>
      dept.department_name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [departments, search]);

  const handleAdd = () => {
    setSelectedDepartment(null);
    setDialogOpen(true);
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setDialogOpen(true);
  };

  const handleDelete = async (department) => {
    if (
      !window.confirm(
        `Delete "${department.department_name}" ?`
      )
    )
      return;

    try {
      await deleteDepartment(department.department_id);

      loadDepartments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (form) => {
    try {
      setLoading(true);

      if (selectedDepartment) {
        await updateDepartment(
          selectedDepartment.department_id,
          form
        );
      } else {
        await createDepartment(form);
      }

      setDialogOpen(false);

      loadDepartments();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      Department Management
    </div>
  );
}