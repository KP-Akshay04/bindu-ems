import { useEffect, useState, useMemo } from "react";
import { Users2, RefreshCw } from "lucide-react";
import { fetchAttendance, fetchEmployees } from "../services/api";
import { extractList, initials } from "../utils/format";
import StatusBadge from "./StatusBadge";

const todayISO = () => new Date().toISOString().split("T")[0];

const fmtTime = (input) => {
  if (!input || input === "None") return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

export default function TeamTodayPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empData, attData] = await Promise.all([fetchEmployees(), fetchAttendance()]);
      setEmployees(extractList(empData, "employees"));
      setAttendance(extractList(attData, "attendance"));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load team data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const today = todayISO();
    const byEmp = new Map();
    attendance.forEach((a) => {
      if (String(a.attendance_date).slice(0, 10) === today) {
        byEmp.set(String(a.employee_id), a);
      }
    });
    return employees.map((e) => ({
      employee: e,
      record: byEmp.get(String(e.employee_id ?? e.id)) || null,
    }));
  }, [employees, attendance]);

  const counts = useMemo(() => {
    const c = { working: 0, lunch: 0, completed: 0, absent: 0 };
    rows.forEach(({ record }) => {
      const s = String(record?.status ?? "").toLowerCase();
      if (s === "working") c.working += 1;
      else if (s === "lunch break") c.lunch += 1;
      else if (s === "logged out") c.completed += 1;
      else c.absent += 1;
    });
    return c;
  }, [rows]);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-brand-600" />
          <h3 className="text-base font-bold text-slate-800">Team Status Today</h3>
        </div>
        <button onClick={load} className="btn-ghost text-slate-500" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <MiniStat label="Working" value={counts.working} tone="emerald" />
        <MiniStat label="Lunch" value={counts.lunch} tone="amber" />
        <MiniStat label="Completed" value={counts.completed} tone="brand" />
        <MiniStat label="Not In" value={counts.absent} tone="slate" />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="max-h-[420px] overflow-y-auto pr-1">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 sticky top-0">
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Login</th>
              <th className="px-3 py-2">Logout</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  No employees found.
                </td>
              </tr>
            )}
            {rows.map(({ employee, record }) => {
              const name = employee.name || `Employee #${employee.employee_id ?? employee.id}`;
              return (
                <tr key={employee.employee_id ?? employee.id} className="hover:bg-brand-50/40">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-brand-100 bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[11px] font-bold">
                        {initials(name)}
                      </span>
                      <div className="leading-tight">
                        <p className="font-semibold text-slate-800 text-sm">{name}</p>
                        <p className="text-[11px] text-slate-500">{employee.department ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-700">{fmtTime(record?.login_time)}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{fmtTime(record?.logout_time)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={record?.status ?? "Not In"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    brand: "bg-brand-50 border-brand-100 text-brand-700",
    slate: "bg-slate-50 border-slate-200 text-slate-600",
  };
  return (
    <div className={`p-2 rounded-lg border ${tones[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold">{label}</p>
      <p className="text-lg font-extrabold leading-tight">{value}</p>
    </div>
  );
}