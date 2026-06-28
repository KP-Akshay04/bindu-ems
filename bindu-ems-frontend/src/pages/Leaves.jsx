import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarX, CalendarPlus, Search } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import { fetchLeaves, createLeave, approveLeave, rejectLeave, } from "../services/api";
import { extractList, formatDate, initials } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import LeaveDetailsDialog from "../components/LeaveDetailsDialog";

export default function Leaves() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
  employee_id: user?.employee_id || "", leave_type: "Casual Leave", start_date: "", end_date: "", reason: ""});
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaves(
  user?.role === "Employee"
    ? { employee_id: user.employee_id }
    : {}
);
      setItems(extractList(data, "leaves"));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load leaves.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    approved: items.filter((l) => String(l.status).toLowerCase() === "approved").length,
    pending: items.filter((l) => String(l.status).toLowerCase() === "pending").length,
    rejected: items.filter((l) => String(l.status).toLowerCase() === "rejected").length,
    total: items.length,
  }), [items]);

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((l) => {
      const matchQ =
        !q ||
        String(l.employee_name ?? l.full_name ?? "").toLowerCase().includes(q) ||
        String(l.employee_code ?? "").toLowerCase().includes(q) ||
        String(l.employee_id ?? "").toLowerCase().includes(q) ||
        String(l.department ?? "").toLowerCase().includes(q) ||
        String(l.designation ?? "").toLowerCase().includes(q) ||
        String(l.leave_type ?? "").toLowerCase().includes(q);
      const matchTab = tab === "all" || String(l.status).toLowerCase() === tab;
      return matchQ && matchTab;
    });
  }, [items, query, tab]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createLeave({
  ...form,
  employee_id: user.employee_id,
});
      setOpen(false);
      setForm({employee_id: "", leave_type: "Casual Leave", start_date: "", end_date: "", reason: ""});
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Submit failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (leaveId) => {
  try {
    await approveLeave(leaveId);
    await load();
  } catch (err) {
    alert(
      err?.response?.data?.message ||
      err.message
    );
  }
};

const handleReject = async (leaveId) => {
  try {
    await rejectLeave(leaveId);
    await load();
  } catch (err) {
    alert(
      err?.response?.data?.message ||
      err.message
    );
  }
};

  if (loading) return <LoadingSpinner label="Loading leaves..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const openLeave = (leave) => { setSelectedLeave(leave);};
  const closeLeave = () => { setSelectedLeave(null);};

  const STATS = [
    { label: "Approved", value: counts.approved, icon: CalendarCheck, accent: "from-emerald-400 to-teal-600" },
    { label: "Pending", value: counts.pending, icon: CalendarClock, accent: "from-amber-400 to-orange-500" },
    { label: "Rejected", value: counts.rejected, icon: CalendarX, accent: "from-rose-400 to-pink-600" },
    { label: "Total Requests", value: counts.total, icon: CalendarPlus, accent: "from-brand-400 to-brand-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center shadow-md`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by employee, ID or type..."
            className="input h-11 pl-10"
          />
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary h-11">
          <CalendarPlus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-white/70 backdrop-blur-md border border-brand-100 rounded-xl w-fit">
        {[
          { id: "all", label: "All" },
          { id: "pending", label: `Pending (${counts.pending})` },
          { id: "approved", label: `Approved (${counts.approved})` },
          { id: "rejected", label: `Rejected (${counts.rejected})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t.id
                ? "bg-gradient-to-r from-brand-400 to-brand-600 text-white"
                : "text-slate-600 hover:text-brand-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No leave requests" message="No requests match your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((l) => {
            const name = l.employee_name || l.name || `Employee #${l.employee_id ?? ""}`;
            return (
              <div key={l.leave_id ?? l.id ?? `${l.employee_id}-${l.start_date}`}
                  className="glass-card p-5 hover:-translate-y-0.5 transition-transform"
        >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-full ring-2 ring-brand-100 bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold">
                      {initials(name)}
                    </span>
                    <div className="leading-tight">
                      <p className="font-semibold text-slate-800"> {l.employee_name || l.full_name || name} </p>

                      <p className="text-xs text-slate-500"> ID : {l.employee_id} {" • "} {l.employee_code} {" • "} {l.department ?? "Department"}</p>
                      <p className="text-xs text-slate-400"> {l.designation ?? l.role ?? "Employee"}</p>
                    </div>
                  </div>
                  <StatusBadge status={l.status ?? "Pending"} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Type</p>
                    <p className="font-semibold text-slate-700">{l.leave_type ?? l.type ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Duration</p>
                    <p className="font-semibold text-slate-700">{l.days ? `${l.days} Day${l.days > 1 ? "s" : ""}`: "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">From</p>
                    <p className="font-mono text-slate-700">{formatDate(l.from_date ?? l.from)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">To</p>
                    <p className="font-mono text-slate-700">{formatDate(l.to_date ?? l.to)}</p>
                  </div>
                </div>
                {l.reason && (
                  <p className="text-sm text-slate-600 bg-brand-50/60 rounded-lg px-3 py-2 border border-brand-100/70">
                    {l.reason}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-3">Applied on {formatDate(l.applied_on ?? l.created_at)}</p>

                {user?.role !== "Employee" &&
 String(l.status).toLowerCase() === "pending" && (
  <div className="flex gap-2 mt-4">

    <button
  onClick={() => openLeave(l)}
  className="px-3 py-2 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 text-sm font-semibold"
>
  View
</button>

    <button
      onClick={() =>
        handleApprove(
          l.leave_id
        )
      }
      className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
    >
      Approve
    </button>

    <button
      onClick={() =>
        handleReject(
          l.leave_id
        )
      }
      className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
    >
      Reject
    </button>
  </div>
)}

              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply for Leave"
        description="Submit a leave request to your reporting manager."
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          
          <div>
            <label className="label">Leave Type</label>
            <select className="input" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
              <option>Casual Leave</option>
              <option>Sick Leave</option>
              <option>Earned Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From</label>
              <input type="date" className="input" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea rows={3} className="input h-auto py-2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Brief reason..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</button>
          </div>
        </form>
      </Modal>

      <LeaveDetailsDialog
  open={Boolean(selectedLeave)}
  leave={selectedLeave}
  onClose={closeLeave}
  canManage={
    user?.role === "Super Admin" ||
    user?.role === "HR"
  }
  onApprove={handleApprove}
  onReject={handleReject}
/>

    </div>
  );
}