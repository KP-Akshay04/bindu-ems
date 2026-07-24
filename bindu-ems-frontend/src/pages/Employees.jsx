// Employees.jsx
// COMPLETE REPLACEMENT - PART 1/2

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Pencil,
  UserX,
} from "lucide-react";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import EmployeeFormDialog from "../components/EmployeeFormDialog";
import EmployeeProfileDialog from "../components/EmployeeProfileDialog";
import ConfirmDialog from "../components/ConfirmDialog";

import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from "../services/api";

import {
  extractList,
  formatDate,
  initials,
} from "../utils/format";

export default function Employees() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);

  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState(null);

  const [viewEmployee, setViewEmployee] =
    useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    employee: null,
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchEmployees();

      setEmployees(
        extractList(response, "employees")
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Unable to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const departments = useMemo(() => {
    return [
      ...new Set(
        employees
          .map((e) => e.department_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    return employees.filter((emp) => {
      const matchesSearch =
        !search ||
        String(emp.full_name ?? "")
          .toLowerCase()
          .includes(search) ||
        String(emp.employee_code ?? "")
          .toLowerCase()
          .includes(search) ||
        String(emp.employee_id ?? "")
          .toLowerCase()
          .includes(search) ||
        String(emp.email ?? "")
          .toLowerCase()
          .includes(search) ||
        String(emp.phone ?? "")
          .toLowerCase()
          .includes(search) ||
        String(emp.department_name ?? "")
          .toLowerCase()
          .includes(search) ||
        String(emp.designation_name ?? "")
          .toLowerCase()
          .includes(search) ||
        String(emp.branch_name ?? "")
          .toLowerCase()
          .includes(search);

      const matchesDepartment =
        departmentFilter === "all" ||
        emp.department_name ===
          departmentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        String(emp.status)
          .toLowerCase() ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }, [
    employees,
    query,
    departmentFilter,
    statusFilter,
  ]);

  const addEmployee = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  const editEmployee = (employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const viewProfile = (employee) => {
    setViewEmployee(employee);
  };

  const saveEmployee = async (payload) => {
    try {
      setSaving(true);

      if (editingEmployee?.employee_id) {
        await updateEmployee(
          editingEmployee.employee_id,
          payload
        );
      } else {
        await createEmployee(payload);
      }

      setDialogOpen(false);
      setEditingEmployee(null);

      await loadEmployees();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err.message
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!confirm.employee) return;

    try {
      setSaving(true);

      await deactivateEmployee(
        confirm.employee.employee_id
      );

      setConfirm({
        open: false,
        employee: null,
      });

      await loadEmployees();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err.message
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <LoadingSpinner label="Loading Employees..." />
    );

  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={loadEmployees}
      />
    );

  // ===== CONTINUES IN PART 2 =====
    return (
    <div className="space-y-5">

      {/* Toolbar */}

      <div className="glass-card p-5 flex flex-col lg:flex-row lg:items-center gap-4">

        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          <input
            className="input h-11 pl-10"
            placeholder="Search by name, employee code, email, department, designation or branch..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <select
              className="input h-11 pl-9 pr-8 w-[210px]"
              value={departmentFilter}
              onChange={(e) =>
                setDepartmentFilter(e.target.value)
              }
            >
              <option value="all">
                All Departments
              </option>

              {departments.map((department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              ))}
            </select>
          </div>

          <select
            className="input h-11 w-[170px]"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="On Leave">
              On Leave
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>

          <button
            className="btn-primary h-11"
            onClick={addEmployee}
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>

        </div>

      </div>

      {filteredEmployees.length === 0 ? (

        <EmptyState
          title="No Employees Found"
          message="Try changing the filters or create a new employee."
        />

      ) : (

        <div className="glass-card overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-brand-50/60">

                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 font-bold">

                  <th className="px-5 py-3">
                    Employee
                  </th>

                  <th className="px-5 py-3">
                    Department
                  </th>

                  <th className="px-5 py-3">
                    Designation
                  </th>

                  <th className="px-5 py-3">
                    Branch
                  </th>

                  <th className="px-5 py-3">
                    Joined
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredEmployees.map((employee) => (

                  <tr
                    key={employee.employee_id}
                    className="hover:bg-brand-50/40"
                  >

                    <td className="px-5 py-3">

                      <div className="flex items-center gap-3">

                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold ring-2 ring-brand-100">

                          {initials(employee.full_name)}

                        </span>

                        <div>

                          <p className="font-semibold text-slate-800">

                            {employee.full_name}

                          </p>

                          <p className="text-xs text-slate-500">

                            ID : {employee.employee_id}
                            {" • "}
                            {employee.employee_code}
                            {" • "}
                            {employee.email}

                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-5 py-3">
                      {employee.department_name || "—"}
                    </td>

                    <td className="px-5 py-3">
                      {employee.designation_name || "—"}
                    </td>

                    <td className="px-5 py-3">
                      {employee.branch_name || "—"}
                    </td>

                    <td className="px-5 py-3">
                      {employee.joining_date
                        ? formatDate(employee.joining_date)
                        : "—"}
                    </td>

                    <td className="px-5 py-3">
                      <StatusBadge
                        status={
                          employee.status || "Active"
                        }
                      />
                    </td>

                    <td className="px-5 py-3">

                      <div className="flex justify-end gap-1">

                        <button
                          className="btn-ghost text-brand-600"
                          title="View"
                          onClick={() =>
                            viewProfile(employee)
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          className="btn-ghost text-amber-600"
                          title="Edit"
                          onClick={() =>
                            editEmployee(employee)
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          className="btn-ghost text-rose-600"
                          title="Deactivate"
                          onClick={() =>
                            setConfirm({
                              open: true,
                              employee,
                            })
                          }
                        >
                          <UserX className="w-4 h-4" />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div className="px-5 py-3 border-t border-brand-50 bg-white/60 flex items-center justify-between text-xs text-slate-500">

            <span>

              Showing {filteredEmployees.length} of{" "}
              {employees.length} employees

            </span>

            <span>
              Source : /api/employees
            </span>

          </div>

        </div>

      )}

      <EmployeeFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEmployee(null);
        }}
        initial={editingEmployee}
        loading={saving}
        onSubmit={saveEmployee}
      />

      <EmployeeProfileDialog
        open={Boolean(viewEmployee)}
        employee={viewEmployee}
        onClose={() =>
          setViewEmployee(null)
        }
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={() =>
          setConfirm({
            open: false,
            employee: null,
          })
        }
        onConfirm={deactivate}
        loading={saving}
        danger
        title="Deactivate Employee?"
        message={`This will deactivate ${
          confirm.employee?.full_name ??
          "this employee"
        }.`}
        confirmLabel="Deactivate"
      />

    </div>
  );
}