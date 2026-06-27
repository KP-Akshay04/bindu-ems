import { useEffect, useState } from "react";
import { getShifts } from "../services/shiftService";
import Modal from "./Modal";

const EMPTY = {
  employee_code: "",
  full_name: "",
  email: "",
  password: "",
  phone: "",
  department: "",
  designation: "",
  status: "Active",
  role: "Employee",
  shift_id: "",
};

export default function EmployeeFormDialog({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(EMPTY);
  const isEdit = Boolean(initial?.employee_id);

  const [shifts, setShifts] = useState([]);

useEffect(() => {
  const loadShifts = async () => {
    try {
      const res = await getShifts();
      setShifts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  loadShifts();
}, []);

  useEffect(() => {
    if (open) {
      setForm({
        employee_code: initial?.employee_code ?? "",
        full_name: initial?.full_name ?? "",
        email: initial?.email ?? "",
        password: "",
        phone: initial?.phone ?? "",
        designation: initial?.designation ?? "",
        role: initial?.role ?? "Employee",
        shift_id: initial?.shift_id ?? "",
        department: initial?.department ?? "",
        status: initial?.status ?? "Active",
      });
    }
  }, [open, initial]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
  e.preventDefault();

  onSubmit?.({
    ...form,
    shift_id: form.shift_id
      ? Number(form.shift_id)
      : null,
  });
};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Employee" : "Add Employee"}
      description={isEdit ? "Update employee details." : "Create a new employee record."}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" required value={form.full_name} onChange={update("full_name")} placeholder="Aarav Sharma" />
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

        <div>
  <label className="label">Employee Code</label>
  <input
    className="input"
    required
    value={form.employee_code}
    onChange={update("employee_code")}
    placeholder="EMP002"
  />
</div>

<div>
  <label className="label">Password</label>
  <input
    className="input"
    type="password"
    required={!isEdit}
    value={form.password}
    onChange={update("password")}
    placeholder="password123"
  />
</div>

<div>
  <label className="label">Shift</label>

  <select
    className="input"
    value={form.shift_id}
    onChange={update("shift_id")}
  >
    <option value="">Select Shift</option>

    {shifts.map((shift) => (
      <option
        key={shift.shift_id}
        value={shift.shift_id}
      >
        {shift.shift_name}
      </option>
    ))}
  </select>
</div>

<div>
  <label className="label">Role</label>
  <select
    className="input"
    value={form.role}
    onChange={update("role")}
  >
    <option>HR</option>
    <option>Employee</option>
    <option>Super Admin</option>
  </select>
</div>

<div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update Employee" : "Create Employee"}
          </button>
        </div>

      </form>
    </Modal>
  );
}