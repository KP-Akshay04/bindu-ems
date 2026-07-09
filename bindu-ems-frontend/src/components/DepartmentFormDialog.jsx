import { useEffect, useState } from "react";
import Modal from "./Modal";

const EMPTY = {
  department_name: "",
  status: "Active",
};

export default function DepartmentFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  loading,
}) {
  const [form, setForm] = useState(EMPTY);

  const isEdit = Boolean(initial?.department_id);

  useEffect(() => {
    if (open) {
      setForm({
        department_name: initial?.department_name ?? "",
        status: initial?.status ?? "Active",
      });
    }
  }, [open, initial]);

  const update = (key) => (e) =>
    setForm({
      ...form,
      [key]: e.target.value,
    });

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Department" : "Add Department"}
      description={
        isEdit
          ? "Update department details."
          : "Create a new department."
      }
      size="md"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Department Name</label>

          <input
            className="input"
            required
            value={form.department_name}
            onChange={update("department_name")}
            placeholder="IT"
          />
        </div>

        <div>
          <label className="label">Status</label>

          <select
            className="input"
            value={form.status}
            onChange={update("status")}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : isEdit
              ? "Update Department"
              : "Create Department"}
          </button>
        </div>
      </form>
    </Modal>
  );
}