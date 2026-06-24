import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarRange,
  Wallet,
  LogOut,
  Waves,
  ChevronLeft,
  Bell,
  Clock3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { attendanceCheckOut } from "../services/api";

function DropLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id="sbDrop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <path d="M32 4C32 4 10 28 10 42a22 22 0 1 0 44 0C54 28 32 4 32 4Z" fill="url(#sbDrop)" />
    </svg>
  );
}

const NAV_ITEMS = {
  "Super Admin": [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employees", label: "Employees", icon: Users },
    { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
    { to: "/leaves", label: "Leave Management", icon: CalendarRange },
    { to: "/payroll", label: "Payroll", icon: Wallet },
    { to: "/announcements", label: "Announcements", icon: Bell },
    { to: "/shifts", label: "Shift Management", icon: Clock3 },
  ],
  "HR Admin": [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employees", label: "Employees", icon: Users },
    { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
    { to: "/leaves", label: "Leave Management", icon: CalendarRange },
    { to: "/payroll", label: "Payroll", icon: Wallet },
    { to: "/announcements", label: "Announcements", icon: Bell },
    { to: "/shifts", label: "Shift Management", icon: Clock3 },
  ],
  "Employee": [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/attendance", label: "My Attendance", icon: ClipboardCheck },
    { to: "/leaves", label: "My Leaves", icon: CalendarRange },
    { to: "/payroll", label: "My Payslips", icon: Wallet },
    { to: "/announcements", label: "Announcements", icon: Bell },
  ],
};

export default function Sidebar({ collapsed = false, onToggle, onNavigate }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const width = collapsed ? "w-[78px]" : "w-[260px]";
  const role = user?.role || "Employee";
  const NAV = NAV_ITEMS[role] || NAV_ITEMS["Employee"];

  const handleSignOut = async () => {
  try {
    if (user?.employee_id) {
      await attendanceCheckOut(user.employee_id);
    }
  } catch (e) {
    console.error("Auto check-out issue:", e);
  }

  logout();
  navigate("/login");
};

  return (
    <aside className={`${width} h-full flex flex-col bg-white/85 backdrop-blur-xl border-r border-brand-100 shadow-[0_0_40px_-20px_rgba(2,132,199,0.25)] transition-[width] duration-200`}>
      <div className="px-4 pt-6 pb-5 border-b border-brand-50 flex items-center gap-2.5">
        <DropLogo size={36} />
        {!collapsed && (
          <div className="leading-none flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">BINDU</span>
              <span className="text-lg font-extrabold tracking-tight text-brand-500">EMS</span>
            </div>
            <p className="text-[9px] tracking-[0.28em] font-semibold text-slate-400 mt-1">WATER COMPANY</p>
          </div>
        )}
        {onToggle && (
          <button onClick={onToggle} className="btn-ghost text-slate-500 hidden lg:inline-flex" aria-label="Toggle sidebar">
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {!collapsed && user && (
  <div className="px-4 py-3 border-b border-brand-50">
    <p className="font-semibold text-slate-800 truncate">
      {user.full_name}
    </p>

    <p className="text-xs text-slate-500">
      {user.employee_code}
    </p>

    <p className="text-xs text-brand-600 font-medium">
      {user.role}
    </p>
  </div>
)}


      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 ${collapsed ? "justify-center px-2" : "px-3.5"} py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-brand-400 to-brand-600 text-white shadow-[0_8px_20px_-8px_rgba(2,132,199,0.6)]"
                  : "text-slate-600 hover:bg-brand-50 hover:text-brand-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-brand-500"}`} strokeWidth={2.2} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-5">
        {!collapsed && (
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/70 border border-brand-100 p-4 mb-3">
            <div className="flex items-center gap-2 text-brand-600 mb-2">
              <Waves className="w-4 h-4" />
              <p className="text-[11px] tracking-[0.22em] font-semibold">PURE · TRUSTED</p>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              Workforce precisely managed across every drop.
            </p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 ${collapsed ? "justify-center px-2" : "px-3.5"} py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors`}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" strokeWidth={2.2} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}