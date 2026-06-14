import { useEffect, useState } from "react";
import Modal from "./Modal";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  status: "Active",
};

export default function EmployeeFormDialog({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(EMPTY);
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        email: initial?.email ?? "",
        phone: initial?.phone ?? "",
        department: initial?.department ?? "",
        designation: initial?.designation ?? "",
        status: initial?.status ?? "Active",
      });
    }
  }, [open, initial]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Employee" : "Add Employee"}
      description={isEdit ? "Update employee details." : "Create a new employee record."}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" required value={form.name} onChange={update("name")} placeholder="Aarav Sharma" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={update("email")} placeholder="name@binduwater.in" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={update("phone")} placeholder="+91 98765 10000" />
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={update("department")} placeholder="Production" />
          </div>
          <div>
            <label className="label">Designation</label>
            <input className="input" value={form.designation} onChange={update("designation")} placeholder="Plant Supervisor" />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={update("status")}>
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}