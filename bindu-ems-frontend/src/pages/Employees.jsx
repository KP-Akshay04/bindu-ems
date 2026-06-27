import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Filter, Eye, Pencil, UserX } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import EmployeeFormDialog from "../components/EmployeeFormDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import { fetchEmployees, createEmployee, updateEmployee, deactivateEmployee } from "../services/api";
import { extractList, formatDate, initials } from "../utils/format";

export default function Employees() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirm, setConfirm] = useState({ open: false, target: null });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmployees();
      setItems(extractList(data, "employees"));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const departments = useMemo(() => {
    const set = new Set(items.map((e) => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((e) => {
      const matchesQ =
        !q ||
        String(e.full_name ?? "").toLowerCase().includes(q) ||
        String(e.employee_code ?? "").toLowerCase().includes(q) ||
        String(e.id ?? "").toLowerCase().includes(q) ||
        String(e.email ?? "").toLowerCase().includes(q) ||
        String(e.designation ?? "").toLowerCase().includes(q);
      const matchesD = dept === "all" || e.department === dept;
      const matchesS = status === "all" || String(e.status).toLowerCase() === status.toLowerCase();
      return matchesQ && matchesD && matchesS;
    });
  }, [items, query, dept, status]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (emp) => { setEditing(emp); setFormOpen(true); };

  const submitForm = async (payload) => {
    setSaving(true);
    try {
      if (editing?.employee_id) {
          await updateEmployee(editing.employee_id, payload);
      } else {
        await createEmployee(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const doDeactivate = async () => {
    if (!confirm.target?.employee_id) return;
    setSaving(true);
    try {
      await deactivateEmployee(confirm.target.employee_id);
      setConfirm({ open: false, target: null });
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading employees..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="glass-card p-5 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, email or role..."
            className="input h-11 pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="input h-11 pl-9 pr-8 w-[200px]">
              <option value="all">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input h-11 w-[160px]">
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button onClick={openAdd} className="btn-primary h-11">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No employees found" message="Try adjusting your filters or add a new employee." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50/60">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.employee_id ?? e.id ?? e.employee_code} className="hover:bg-brand-50/40" >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-brand-100 bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold">
                          {initials(e.full_name)}
                        </span>
                        <div className="leading-tight">
                          <p className="font-semibold text-slate-800">{e.full_name ?? "—"} </p>
                          <p className="text-xs text-slate-500">{e.employee_code ?? "—"} · {e.email ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{e.department ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{e.designation ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(e.joined_date ?? e.joined ?? e.created_at)}</td>
                    <td className="px-5 py-3"><StatusBadge status={e.status ?? "Active"} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="btn-ghost text-brand-600" title="View / Edit">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(e)} className="btn-ghost text-amber-600" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirm({ open: true, target: e })} className="btn-ghost text-rose-600" title="Deactivate">
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-brand-50 bg-white/60 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {filtered.length} of {items.length} employees</span>
            <span>Source: /api/employees</span>
          </div>
        </div>
      )}

      <EmployeeFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={submitForm}
        initial={editing}
        loading={saving}
      />
      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, target: null })}
        onConfirm={doDeactivate}
        title="Deactivate employee?"
        message={`This will deactivate ${confirm.target?.name ?? "the employee"}. They can be re-activated later from the backend.`}
        confirmLabel="Deactivate"
        danger
        loading={saving}
      />
    </div>
  );
}