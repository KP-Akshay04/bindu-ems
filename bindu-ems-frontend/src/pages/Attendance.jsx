import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { UserCheck, UserX, Clock, CalendarOff, Search } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { fetchAttendance } from "../services/api";
import { extractList, formatDate, formatTime, initials } from "../utils/format";
import { useAuth } from "../context/AuthContext";


export default function Attendance({
    myRecordsOnly = false,
}) {
  const { user } = useAuth();
  const location = useLocation();
  const isMyAttendance = location.pathname === "/my-attendance";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("today");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
const data = await fetchAttendance(
  isMyAttendance || user?.role === "Employee"
    ? { employee_id: user.employee_id }
    : {}
);
      setItems(extractList(data, "attendance"));
      console.log(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const now = new Date();

const today =
  now.getFullYear() +
  "-" +
  String(now.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(now.getDate()).padStart(2, "0");
  const todayList = useMemo(
  () =>
    items.filter(
      (a) =>
        String(
          a.attendance_date ??
          a.date ??
          a.created_at ??
          ""
        ).slice(0, 10) === today
    ),
  [items, today]
);
console.log("TODAY =", today);
console.log("TODAY LIST =", todayList);

  const counts = useMemo(() => {
  const c = { present: 0, late: 0, absent: 0, leave: 0 };

  (todayList.length ? todayList : items).forEach((a) => {
    const s = String(a.status ?? "").toLowerCase();

    if (
      s === "present" ||
      s === "checked-in" ||
      s === "working" ||
      s === "loggedout" ||
      s === "logged out"
    ) {
      c.present++;
    } else if (s === "late") {
      c.late++;
    } else if (s === "absent") {
      c.absent++;
    } else if (
      s === "on leave" ||
      s === "leave"
    ) {
      c.leave++;
    }
  });

  return c;
}, [items, todayList]);

  const trend = useMemo(() => {
    const buckets = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({ day: d, present: 0 }));
    items.forEach((a) => {
      const dt = new Date(a.attendance_date ?? a.date ?? a.created_at ?? 0);
      if (isNaN(dt.getTime())) return;
      const idx = (dt.getDay() + 6) % 7;
      const s = String(a.status ?? "").toLowerCase();
      if (s === "present" || s === "checked-in" || s === "late") buckets[idx].present += 1;
    });
    return buckets;
  }, [items]);

  if (loading) return <LoadingSpinner label="Loading attendance..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const STATS = [
    { label: "Present", value: counts.present, icon: UserCheck, accent: "from-emerald-400 to-teal-600" },
    { label: "Late", value: counts.late, icon: Clock, accent: "from-amber-400 to-orange-500" },
    { label: "Absent", value: counts.absent, icon: UserX, accent: "from-rose-400 to-pink-600" },
    { label: "On Leave", value: counts.leave, icon: CalendarOff, accent: "from-brand-400 to-brand-600" },
  ];

  const visible = (tab === "today" ? todayList : items).filter((a) => {

  const q = query.toLowerCase().trim();

  if (!q) return true;

  return (
    String(a.employee_name ?? "").toLowerCase().includes(q) ||
    String(a.employee_code ?? "").toLowerCase().includes(q) ||
    String(a.employee_id ?? "").toLowerCase().includes(q) ||
    String(a.department ?? "").toLowerCase().includes(q) ||
    String(a.designation ?? "").toLowerCase().includes(q)
  );

});

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

      {!isMyAttendance && (

<div className="glass-card p-4">

  <div className="relative">

    <Search
      className="absolute left-3 top-1/2 -translate-y-1/2
                 w-4 h-4 text-slate-400"
    />

    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search employee by ID, Code, Name, Department or Designation..."
      autoComplete="off"
      className="input h-11 pl-10"
    />

  </div>

</div>

)}
      <div className="flex gap-1 p-1 bg-white/70 backdrop-blur-md border border-brand-100 rounded-xl w-fit">
        {[
          { id: "today", label: "Today" },
          { id: "all", label: "All Records" },
          { id: "trend", label: "Trend" },
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

      {tab === "trend" ? (
        <div className="glass-card p-5">
          <h3 className="text-base font-bold text-slate-800 mb-2">Attendance Across the Week</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #BAE6FD", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="present" stroke="#0EA5E9" strokeWidth={3} fill="url(#presentGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title="No attendance records" message={tab === "today" ? "No records logged today yet." : "No attendance has been logged."} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50/60">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                  {!isMyAttendance && (
                  <th className="px-5 py-3">Employee</th>
                  )}
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Check In</th>
                  <th className="px-5 py-3">Lunch Out</th>
                  <th className="px-5 py-3">Lunch In</th>
                  <th className="px-5 py-3">Check Out</th>
                  <th className="px-5 py-3">Lunch Min</th>
                  <th className="px-5 py-3">Hours</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((a, i) => {
                  const name = a.employee_name || `Employee #${a.employee_id ?? "—"}`;
                  return (
                    <tr key={a.id ?? i} className="hover:bg-brand-50/40">
                      {!isMyAttendance && (
  <td className="px-5 py-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold">
        {initials(name)}
      </div>

      <div>
        <p className="font-semibold text-slate-800">
          {name}
        </p>

        <p className="text-xs text-slate-500">
          {a.employee_code}
        </p>
      </div>
    </div>
  </td>
)}
                      <td className="px-5 py-3 text-slate-700">{formatDate(a.attendance_date ?? a.date ?? a.created_at)}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">{formatTime(a.check_in ?? a.login_time)}</td>
                      <td className="px-5 py-3 font-mono text-orange-600">{a.lunch_start_time? formatTime(a.lunch_start_time): "—"}</td>
                      <td className="px-5 py-3 font-mono text-emerald-600">{a.lunch_end_time? formatTime(a.lunch_end_time): "—"}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">{formatTime(a.check_out ?? a.logout_time)}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">{a.lunch_minutes ?? 0}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">{a.working_hours ? `${a.working_hours} hrs` : "—"}</td>
                      <td className="px-5 py-3"><StatusBadge status={a.status ?? "—"} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}