import { useEffect, useMemo, useState } from "react";
import { Wallet, TrendingUp, CheckCircle2, Clock, IndianRupee, Search, Plus, } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { fetchPayroll, markPayrollPaid, fetchEmployees, createPayroll, } from "../services/api";
import { extractList, formatINR, formatDate, initials } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import PayslipDialog from "../components/PayslipDialog";


export default function Payroll({
  myRecordsOnly = false,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [creating, setCreating] = useState(false);

  const [payrollForm, setPayrollForm] = useState({
    employee_id: "",
    basic_salary: "",
    allowances: "",
    deductions: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPayslip, setShowPayslip] = useState(false);

  const load = async () => {
  setLoading(true);
  setError(null);

  try {
    const payrollData = await fetchPayroll(
  myRecordsOnly || user?.role === "Employee"
    ? {
        employee_id: user.employee_id,
      }
    : {}
);

    setItems(
      extractList(
        payrollData,
        "payroll"
      )
    );

    if (
      user?.role !==
      "Employee"
    ) {
      const employeeData =
        await fetchEmployees();

      setEmployees(
  extractList(employeeData, "employees")
);
    
    }
  } catch (err) {
    setError(
      err?.response?.data
        ?.message ||
        err.message ||
        "Failed to load payroll."
    );
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (user) {
    load();
  }
}, [user]);

  const enriched = useMemo(
  () =>
    items.map((p) => ({
      ...p,

      _net: Number(
        p.net_salary ??
        p.net ??
        p.net_pay ??
        p.amount ??
        0
      ),

      _basic: Number(
        p.basic_salary ??
        p.basic ??
        0
      ),

      _hra: Number(
        p.hra ??
        0
      ),

      _allowances: Number(
        p.allowances ??
        p.allowance ??
        0
      ),

      _deductions: Number(
        p.deductions ??
        p.deduction ??
        0
      ),
    })),
  [items]
);

  const totals = useMemo(() => {
    return enriched.reduce(
      (acc, p) => {
        acc.total += p._net;
        acc.paid += String(p.status).toLowerCase() === "paid" ? 1 : 0;
        acc.processing += String(p.status).toLowerCase() === "processing" ? 1 : 0;
        return acc;
      },
      { total: 0, paid: 0, processing: 0 }
    );
  }, [enriched]);

  const trend = useMemo(() => {
    // group by month label (YYYY-MM) using pay_date or month field
    const groups = {};
    enriched.forEach((p) => {
      const dateStr = p.pay_date || p.month || p.created_at;
      const dt = dateStr ? new Date(dateStr) : null;
      let key = p.month || (dt && !isNaN(dt.getTime())
        ? dt.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
        : "—");
      groups[key] = (groups[key] || 0) + p._net;
    });
    return Object.entries(groups).map(([month, amount]) => ({ month, amount }));
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return enriched.filter(
      (p) =>
        (!q ||
          String(p.employee_name ?? p.name ?? "").toLowerCase().includes(q) ||
          String(p.employee_code ?? "").toLowerCase().includes(q) ||
          String(p.employee_id ?? "").toLowerCase().includes(q) ||
          String(p.department ?? "").toLowerCase().includes(q) ||
          String(p.designation ?? "").toLowerCase().includes(q) ||
          String(p.pay_date ?? "").toLowerCase().includes(q)) &&
        (status === "all" || String(p.status).toLowerCase() === status.toLowerCase())
    );
  }, [enriched, query, status]);

  if (loading) return <LoadingSpinner label="Loading payroll..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const handleMarkPaid = async (id) => {
  try {
    await markPayrollPaid(id);
    await load();

    alert("Payroll marked as paid");
  } catch (err) {
    alert(
      err?.response?.data?.message ||
      err.message ||
      "Failed to update payroll"
    );
  }
};

const handleCreatePayroll =
  async (e) => {
    e.preventDefault();

    setCreating(true);

    try {
      await createPayroll({
        employee_id: Number(
          payrollForm.employee_id
        ),
        basic_salary: Number(
          payrollForm.basic_salary
        ),
        allowances: Number(
          payrollForm.allowances || 0
        ),
        deductions: Number(
          payrollForm.deductions || 0
        ),
        month: Number(
          payrollForm.month
        ),
        year: Number(
          payrollForm.year
        ),
      });

      alert(
        "Payroll created successfully"
      );

      setShowCreate(false);

      setPayrollForm({
        employee_id: "",
        basic_salary: "",
        allowances: "",
        deductions: "",
        month:
          new Date().getMonth() +
          1,
        year:
          new Date().getFullYear(),
      });

      await load();
    } catch (err) {
      alert(
        err?.response?.data
          ?.message ||
          err.message
      );
    } finally {
      setCreating(false);
    }
  };


  const STATS = [
    { label: "Total Disbursed", value: formatINR(totals.total), icon: Wallet, accent: "from-brand-400 to-brand-600" },
    { label: "Avg. Net Pay", value: formatINR(enriched.length ? totals.total / enriched.length : 0), icon: TrendingUp, accent: "from-violet-400 to-indigo-600" },
    { label: "Paid", value: `${totals.paid}/${enriched.length}`, icon: CheckCircle2, accent: "from-emerald-400 to-teal-600" },
    { label: "Processing", value: totals.processing, icon: Clock, accent: "from-amber-400 to-orange-500" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center shadow-md`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-extrabold text-slate-900 truncate">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-800">Payroll Trend</h3>
            <p className="text-xs text-slate-500">Aggregated by month</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700">
            <IndianRupee className="w-3 h-3 mr-1" /> INR
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0369A1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #BAE6FD", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="amount" fill="url(#payGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!myRecordsOnly && (
  <div className="glass-card p-4 flex flex-col lg:flex-row lg:items-center gap-3">
    <div className="relative flex-1">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by employee, ID, department..."
        className="input h-11 pl-10"
      />
    </div>

    <select
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      className="input h-11 w-[160px]"
    >
      <option value="all">All Status</option>
      <option value="Paid">Paid</option>
      <option value="Processing">Processing</option>
      <option value="On Hold">On Hold</option>
    </select>
  </div>
)}

      {!myRecordsOnly &&
 user?.role !== "Employee" && (
  <div className="flex justify-end">
    <button
      onClick={() => setShowCreate(!showCreate)}
      className="btn-primary"
    >
      <Plus className="w-4 h-4 mr-2" />
      Generate Payroll
    </button>
  </div>
)}

{showCreate && (
  <div className="glass-card p-5">
    <h3 className="text-lg font-bold text-slate-800 mb-4">
      Generate Payroll
    </h3>

    <form
      onSubmit={handleCreatePayroll}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <select
        required
        className="input"
        value={payrollForm.employee_id}
        onChange={(e) =>
          setPayrollForm({
            ...payrollForm,
            employee_id: e.target.value,
          })
        }
      >
        <option value="">
          Select Employee
        </option>

        {employees.map((emp) => (
          <option
            key={emp.employee_id}
            value={emp.employee_id}
          >
            {emp.employee_code} - {emp.full_name}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Basic Salary"
        required
        className="input"
        value={payrollForm.basic_salary}
        onChange={(e) =>
          setPayrollForm({
            ...payrollForm,
            basic_salary: e.target.value,
          })
        }
      />

      <input
        type="number"
        placeholder="Allowances"
        className="input"
        value={payrollForm.allowances}
        onChange={(e) =>
          setPayrollForm({
            ...payrollForm,
            allowances: e.target.value,
          })
        }
      />

      <input
        type="number"
        placeholder="Deductions"
        className="input"
        value={payrollForm.deductions}
        onChange={(e) =>
          setPayrollForm({
            ...payrollForm,
            deductions: e.target.value,
          })
        }
      />

      <input
        type="number"
        min="1"
        max="12"
        placeholder="Month"
        className="input"
        value={payrollForm.month}
        onChange={(e) =>
          setPayrollForm({
            ...payrollForm,
            month: e.target.value,
          })
        }
      />

      <input
        type="number"
        placeholder="Year"
        className="input"
        value={payrollForm.year}
        onChange={(e) =>
          setPayrollForm({
            ...payrollForm,
            year: e.target.value,
          })
        }
      />

      <div className="md:col-span-2 flex justify-end">
        <button
          type="submit"
          disabled={creating}
          className="btn-primary"
        >
          {creating
            ? "Creating..."
            : "Generate Payroll"}
        </button>
      </div>
    </form>
  </div>
)}

      {filtered.length === 0 ? (
        <EmptyState title="No payroll records" message="No payslips match your filters." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50/60">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3 text-right">Basic</th>
                  <th className="px-5 py-3 text-right">HRA</th>
                  <th className="px-5 py-3 text-right">Allowances</th>
                  <th className="px-5 py-3 text-right">Deductions</th>
                  <th className="px-5 py-3 text-right">Net Pay</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Pay Date</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
  {filtered.map((p, i) => {
    const name =
      p.employee_name ||
      p.name ||
      `Employee #${p.employee_id ?? ""}`;

    return (
      <tr
        key={p.payroll_id ?? p.id ?? i}
        className="hover:bg-brand-50/40"
      >
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-brand-100 bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold">
              {initials(name)}
            </span>

            <div className="leading-tight">
              <p className="font-semibold text-slate-800">
  {myRecordsOnly
    ? user.full_name
    : (p.employee_name || p.full_name || name)}
</p>

{!myRecordsOnly && (
  <>
    <p className="text-xs text-slate-500">
      ID : {p.employee_id}
      {" • "}
      {p.employee_code}
      {" • "}
      {p.department ?? "Department"}
    </p>

    <p className="text-xs text-slate-400">
      {p.designation ?? p.role ?? "Employee"}
    </p>
  </>
)}

            </div>
          </div>
        </td>

        <td className="px-5 py-3">

  <div>

    <p className="font-medium text-slate-700">
      {p.department ?? "—"}
    </p>

    <p className="text-xs text-slate-500">
      {p.designation ?? "Employee"}
    </p>

  </div>

</td>

        <td className="px-5 py-3 font-mono text-right text-slate-700">
          {formatINR(p._basic)}
        </td>

        <td className="px-5 py-3 font-mono text-right text-slate-700">
          {formatINR(p._hra)}
        </td>

        <td className="px-5 py-3 font-mono text-right text-slate-700">
          {formatINR(p._allowances)}
        </td>

        <td className="px-5 py-3 font-mono text-right text-rose-600">
          - {formatINR(p._deductions)}
        </td>

        <td className="px-5 py-3 font-mono text-right font-bold text-brand-700">
          {formatINR(p._net)}
        </td>

        <td className="px-5 py-3">
          <StatusBadge status={p.status ?? "—"} />
        </td>

        <td className="px-5 py-3">

  <p className="font-medium">
    {formatDate(p.pay_date ?? p.created_at)}
  </p>

  <p className="text-xs text-slate-500">
    Payroll Date
  </p>

</td>

        <td className="px-5 py-3">

  {user?.role !== "Employee" ? (

    <div className="flex items-center gap-2">

      {String(p.status).toLowerCase() !== "paid" ? (

        <button
          onClick={() =>
            handleMarkPaid(
              p.payroll_id
            )
          }
          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
        >
          Mark Paid
        </button>

      ) : (

        <span className="text-emerald-600 font-semibold">
          Paid ✓
        </span>

      )}

      <button
  onClick={() => {
    setSelectedPayroll(p);
    setShowPayslip(true);
  }}
  className="px-3 py-1 rounded-lg border border-brand-200 text-brand-600 text-xs font-semibold hover:bg-brand-50"
>
  Payslip
</button>

    </div>

  ) : (

    <button
  onClick={() => {
    setSelectedPayroll(p);
    setShowPayslip(true);
  }}
  className="px-3 py-1 rounded-lg border border-brand-200 text-brand-600 text-xs font-semibold hover:bg-brand-50"
>
  Payslip
</button>

  )}

</td>
      </tr>
    );
  })}
</tbody>
</table>

<div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 text-sm text-slate-500">

  <span>

    Showing {filtered.length} payroll record(s)

  </span>

  <span>

    Total Payrolls : {items.length}

  </span>

</div>

</div>
</div>
)}

<PayslipDialog
  open={showPayslip}
  payroll={selectedPayroll}
  onClose={() => {
    setShowPayslip(false);
    setSelectedPayroll(null);
  }}
/>

</div>
);
}