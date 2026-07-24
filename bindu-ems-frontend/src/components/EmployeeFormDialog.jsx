// EmployeeFormDialog.jsx
// ===========================
// PART 1 / 3
// ===========================

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Modal from "./Modal";

import { getBranches } from "../services/branchService";
import { getDepartments } from "../services/departmentService";
import { getDesignations } from "../services/designationService";
import { getShifts } from "../services/shiftService";

const EMPTY = {
  employee_code: "",
  full_name: "",
  email: "",
  password: "",
  phone: "",

  branch_id: "",
  department_id: "",
  designation_id: "",
  shift_id: "",

  joining_date: "",

  role: "Employee",
  status: "Active",

  basic_salary: "",
  leave_balance: "",
};

export default function EmployeeFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  loading,
}) {
  const isEdit = Boolean(initial?.employee_id);

  const [form, setForm] = useState(EMPTY);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);

  const update =
    (field) =>
    ({ target }) =>
      setForm((prev) => ({
        ...prev,
        [field]: target.value,
      }));

  const loadMasters = async () => {
    try {
      const [
        branchRes,
        departmentRes,
        designationRes,
        shiftRes,
      ] = await Promise.all([
        getBranches(),
        getDepartments(),
        getDesignations(),
        getShifts(),
      ]);

      setBranches(branchRes.data || []);
      setDepartments(departmentRes.data || []);
      setDesignations(designationRes.data || []);
      setShifts(shiftRes.data || []);
    } catch (err) {
      console.error("Failed loading masters", err);
    }
  };

  useEffect(() => {
    if (open) {
      loadMasters();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setForm({
      employee_code: initial?.employee_code ?? "",
      full_name: initial?.full_name ?? "",
      email: initial?.email ?? "",
      password: "",
      phone: initial?.phone ?? "",

      branch_id: initial?.branch_id ?? "",
      department_id: initial?.department_id ?? "",
      designation_id: initial?.designation_id ?? "",
      shift_id: initial?.shift_id ?? "",

      joining_date:
        initial?.joining_date_raw ??
        initial?.joining_date ??
        "",

      role: initial?.role ?? "Employee",
      status: initial?.status ?? "Active",

      basic_salary: initial?.basic_salary ?? "",
      leave_balance: initial?.leave_balance ?? "",
    });
  }, [open, initial]);

  const submit = (e) => {
    e.preventDefault();

    onSubmit({
      ...form,

      branch_id: form.branch_id
        ? Number(form.branch_id)
        : null,

      department_id: form.department_id
        ? Number(form.department_id)
        : null,

      designation_id: form.designation_id
        ? Number(form.designation_id)
        : null,

      shift_id: form.shift_id
        ? Number(form.shift_id)
        : null,

      basic_salary: Number(form.basic_salary || 0),

      leave_balance: Number(form.leave_balance || 0),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        isEdit
          ? "Edit Employee"
          : "Add Employee"
      }
      description={
        isEdit
          ? "Update employee details."
          : "Create a new employee."
      }
    >
      <form
        onSubmit={submit}
        className="space-y-5 max-h-[72vh] overflow-y-auto pr-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="label">
              Employee Code
            </label>

            <input
              className="input"
              required
              value={form.employee_code}
              onChange={update("employee_code")}
              placeholder="EMP001"
            />
          </div>

          <div>
            <label className="label">
              Full Name
            </label>

            <input
              className="input"
              required
              value={form.full_name}
              onChange={update("full_name")}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="label">
              Email
            </label>

            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
            />
          </div>

          <div>
            <label className="label">
              Phone
            </label>

            <input
              className="input"
              value={form.phone}
              onChange={update("phone")}
            />
          </div>

          <div>
            <label className="label">
              Password
            </label>

            <input
              className="input"
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={update("password")}
            />
          </div>

          <div>
            <label className="label">
              Branch
            </label>

            <select
              className="input"
              value={form.branch_id}
              onChange={update("branch_id")}
            >
              <option value="">
                Select Branch
              </option>

              {branches.map((branch) => (
                <option
                  key={branch.branch_id}
                  value={branch.branch_id}
                >
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>
                    <div>
            <label className="label">
              Department
            </label>

            <select
              className="input"
              value={form.department_id}
              onChange={update("department_id")}
            >
              <option value="">
                Select Department
              </option>

              {departments.map((department) => (
                <option
                  key={department.department_id}
                  value={department.department_id}
                >
                  {department.department_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              Designation
            </label>

            <select
              className="input"
              value={form.designation_id}
              onChange={update("designation_id")}
            >
              <option value="">
                Select Designation
              </option>

              {designations.map((designation) => (
                <option
                  key={designation.designation_id}
                  value={designation.designation_id}
                >
                  {designation.designation_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              Shift
            </label>

            <select
              className="input"
              value={form.shift_id}
              onChange={update("shift_id")}
            >
              <option value="">
                Select Shift
              </option>

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
            <label className="label">
              Joining Date
            </label>

            <input
              type="date"
              className="input"
              value={form.joining_date}
              onChange={update("joining_date")}
            />
          </div>

          <div>
            <label className="label">
              Role
            </label>

            <select
              className="input"
              value={form.role}
              onChange={update("role")}
            >
              <option value="Super Admin">
                Super Admin
              </option>

              <option value="HR">
                HR
              </option>

              <option value="Employee">
                Employee
              </option>
            </select>
          </div>

          <div>
            <label className="label">
              Status
            </label>

            <select
              className="input"
              value={form.status}
              onChange={update("status")}
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

              <option value="On Leave">
                On Leave
              </option>
            </select>
          </div>

          <div>
            <label className="label">
              Basic Salary
            </label>

            <input
              type="number"
              className="input"
              min="0"
              value={form.basic_salary}
              onChange={update("basic_salary")}
              placeholder="25000"
            />
          </div>

          <div>
            <label className="label">
              Leave Balance
            </label>

            <input
              type="number"
              className="input"
              min="0"
              value={form.leave_balance}
              onChange={update("leave_balance")}
              placeholder="12"
            />
          </div>

        </div>

        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={onClose}
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
              ? "Update Employee"
              : "Create Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}