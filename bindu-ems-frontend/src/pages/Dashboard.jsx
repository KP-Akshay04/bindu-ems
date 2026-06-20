import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  UserCheck,
  CalendarDays,
  Wallet,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import { fetchEmployees, fetchAttendance, fetchLeaves, fetchPayroll, fetchAnnouncements, attendanceLunchOut, attendanceLunchIn, } from "../services/api";
import { formatINR, extractList, initials } from "../utils/format";

const PIE_COLORS = ["#0EA5E9", "#0284C7", "#38BDF8", "#F43F5E"];

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "Employee";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [workStatus, setWorkStatus] = useState("Working");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
  employeesData,
  attendanceData,
  leavesData,
  payrollData,
  announcementsData,
] = await Promise.all([
  fetchEmployees(),
  fetchAttendance(),
  fetchLeaves(),
  fetchPayroll(),
  fetchAnnouncements(),
]);

setEmployees(
  extractList(
    employeesData,
    "employees"
  )
);

setAttendance(
  extractList(
    attendanceData,
    "attendance"
  )
);

setLeaves(
  extractList(
    leavesData,
    "leaves"
  )
);

setPayroll(
  extractList(
    payrollData,
    "payroll"
  )
);

setAnnouncements(
  announcementsData.slice(0, 5)
);

const handleStatusChange = async (
  newStatus
) => {
  try {

    if (
      newStatus === "Lunch Break"
    ) {
      await attendanceLunchOut({
        employee_id:
          user.employee_id,
      });
    }

    if (
      newStatus === "Working" &&
      workStatus ===
        "Lunch Break"
    ) {
      await attendanceLunchIn({
        employee_id:
          user.employee_id,
      });
    }

    setWorkStatus(
      newStatus
    );

  } catch (err) {
    alert(
      err?.response?.data
        ?.message ||
      err.message
    );
  }
};


    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (
  newStatus
) => {

  try {

    if (
      newStatus === "Lunch Break"
    ) {

      await attendanceLunchOut({
        employee_id:
          user.employee_id,
      });

    }

    if (
      newStatus === "Working" &&
      workStatus ===
        "Lunch Break"
    ) {

      await attendanceLunchIn({
        employee_id:
          user.employee_id,
      });

    }

    setWorkStatus(
      newStatus
    );

  } catch (err) {

    console.error(err);

    alert(
      err?.response?.data
        ?.message ||
      err.message
    );

  }

};

  const stats = useMemo(() => {
    const total = employees.length;
    const present = attendance.filter((a) => {
      const s = String(a.status ?? "").toLowerCase();
      return s === "present" || s === "checked-in" || s === "late";
    }).length;
    const onLeave = leaves.filter((l) => String(l.status ?? "").toLowerCase() === "approved").length;
    const monthlyPayroll = payroll.reduce(
      (sum, p) => sum + Number(p.net ?? p.net_pay ?? p.amount ?? 0),
      0
    );
    return { total, present, onLeave, monthlyPayroll };
  }, [employees, attendance, leaves, payroll]);

  const attendanceTrend = useMemo(() => {
    // Group attendance by day-of-week if backend provides per-day records
    const buckets = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({ day: d, present: 0, absent: 0, leave: 0 }));
    attendance.forEach((a) => {
      const dateStr = a.date || a.created_at || a.day;
      if (!dateStr) return;
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return;
      const idx = (dt.getDay() + 6) % 7; // Mon=0
      const s = String(a.status ?? "").toLowerCase();
      if (s === "present" || s === "checked-in" || s === "late") buckets[idx].present += 1;
      else if (s === "absent") buckets[idx].absent += 1;
      else if (s === "on leave" || s === "leave") buckets[idx].leave += 1;
    });
    return buckets;
  }, [attendance]);

  const payrollBreakdown = useMemo(() => {
    const sums = payroll.reduce(
      (acc, p) => {
        acc.basic += Number(p.basic ?? 0);
        acc.hra += Number(p.hra ?? 0);
        acc.allowances += Number(p.allowances ?? p.allowance ?? 0);
        acc.deductions += Number(p.deductions ?? p.deduction ?? 0);
        return acc;
      },
      { basic: 0, hra: 0, allowances: 0, deductions: 0 }
    );
    return [
      { name: "Basic", value: sums.basic },
      { name: "HRA", value: sums.hra },
      { name: "Allowances", value: sums.allowances },
      { name: "Deductions", value: sums.deductions },
    ];
  }, [payroll]);

  const deptHeadcount = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const d = e.department || "Unassigned";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([dept, count]) => ({ dept, count }));
  }, [employees]);

  const recentActivity = useMemo(() => {
    const items = [];
    leaves.slice(0, 3).forEach((l, i) =>
      items.push({
        id: `lv-${l.id ?? i}`,
        who: l.employee_name || l.name || `Employee #${l.employee_id ?? ""}`,
        action: `applied for ${l.leave_type || l.type || "leave"}`,
        when: l.applied_on || l.created_at || "",
      })
    );
    attendance.slice(0, 2).forEach((a, i) =>
      items.push({
        id: `att-${a.id ?? i}`,
        who: a.employee_name || a.name || `Employee #${a.employee_id ?? ""}`,
        action: `checked in (${a.status ?? "—"})`,
        when: a.date || a.created_at || "",
      })
    );
    return items.slice(0, 5);
  }, [leaves, attendance]);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const KPIS =
  role === "Super Admin"
    ? [
        {
          label: "Total Employees",
          value: stats.total,
          delta: "Workforce strength",
          icon: Users,
          accent: "from-brand-400 to-brand-600",
        },
        {
          label: "Present Today",
          value: stats.present,
          delta: "Currently active",
          icon: UserCheck,
          accent: "from-emerald-400 to-teal-600",
        },
        {
          label: "On Leave",
          value: stats.onLeave,
          delta: "Approved leaves",
          icon: CalendarDays,
          accent: "from-amber-400 to-orange-500",
        },
        {
          label: "Monthly Payroll",
          value: formatINR(stats.monthlyPayroll),
          delta: "Latest cycle",
          icon: Wallet,
          accent: "from-violet-400 to-indigo-600",
        },
      ]
    : role === "HR"
    ? [
        {
          label: "Employees",
          value: stats.total,
          delta: "Managed workforce",
          icon: Users,
          accent: "from-brand-400 to-brand-600",
        },
        {
          label: "Present Today",
          value: stats.present,
          delta: "Attendance",
          icon: UserCheck,
          accent: "from-emerald-400 to-teal-600",
        },
        {
          label: "Approved Leaves",
          value: stats.onLeave,
          delta: "Leave requests",
          icon: CalendarDays,
          accent: "from-amber-400 to-orange-500",
        },
      ]
    : role === "Manager"
    ? [
        {
          label: "Attendance",
          value: stats.present,
          delta: "Team activity",
          icon: UserCheck,
          accent: "from-emerald-400 to-teal-600",
        },
        {
          label: "Leaves",
          value: stats.onLeave,
          delta: "Team requests",
          icon: CalendarDays,
          accent: "from-amber-400 to-orange-500",
        },
      ]
    : [
        {
          label: "Attendance",
          value: stats.present,
          delta: "My attendance",
          icon: UserCheck,
          accent: "from-emerald-400 to-teal-600",
        },
        {
          label: "Leave Status",
          value: stats.onLeave,
          delta: "My leaves",
          icon: CalendarDays,
          accent: "from-amber-400 to-orange-500",
        },
      ];

  return (
  <div className="space-y-6">

    <h1 className="text-xl font-bold text-red-500">
      {role}
    </h1>

    {role === "Employee" && (
  <div className="glass-card p-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-bold text-slate-800">
          Attendance Status
        </h3>

        <p className="text-sm text-slate-500">
          Update your current status
        </p>
      </div>

      <select
        value={workStatus}
        onChange={(e) =>
          handleStatusChange(
            e.target.value
          )
        }
        className="input w-48"
      >
        <option value="Working">
          Working
        </option>

        <option value="Lunch Break">
          Lunch Break
        </option>
      </select>
    </div>
  </div>
)}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-5 hover:-translate-y-0.5 transition-transform duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {s.delta}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-800">Weekly Attendance Trend</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">This week</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #BAE6FD", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="present" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4, fill: "#0EA5E9" }} />
                <Line type="monotone" dataKey="absent" stroke="#F43F5E" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="leave" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-base font-bold text-slate-800">Payroll Breakdown</h3>
          <p className="text-xs text-slate-500 mb-2">Current cycle</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payrollBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {payrollBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #BAE6FD", borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass-card p-5">
          <h3 className="text-base font-bold text-slate-800">Department Headcount</h3>
          <p className="text-xs text-slate-500 mb-2">Live from /api/employees</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptHeadcount} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0369A1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="dept" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #BAE6FD", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-base font-bold text-slate-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-sm text-slate-500">No recent activity.</p>
            )}
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-brand-50 transition-colors">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold">
                  {initials(a.who)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold">{a.who}</span> {a.action}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {a.when || "—"}
                  </p>
                </div>
              </div>
            ))}

            <div className="glass-card p-5">
  <h3 className="text-lg font-bold mb-4">
    Recent Announcements
  </h3>

  <div className="space-y-3">
    {announcements.length === 0 ? (
      <p className="text-sm text-slate-500">
        No announcements available.
      </p>
    ) : (
      announcements.map((a) => (
        <div
          key={a.announcement_id}
          className="border-b border-slate-100 pb-3"
        >
          <p className="font-semibold text-slate-800">
            {a.title}
          </p>

          <p className="text-sm text-slate-500 line-clamp-2">
            {a.message}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {new Date(
              a.created_at
            ).toLocaleDateString()}
          </p>
        </div>
      )) 
    )}
  </div>
</div>

          </div>
        </div>
      </div>
    </div>
  );
}