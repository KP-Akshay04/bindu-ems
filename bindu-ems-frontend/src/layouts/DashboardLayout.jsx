import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const TITLES = {
  "/dashboard": { title: "Dashboard", subtitle: "At-a-glance workforce overview" },
  "/employees": { title: "Employees", subtitle: "Manage your workforce directory" },
  "/attendance": { title: "Attendance", subtitle: "Daily check-ins & presence tracking" },
  "/leaves": { title: "Leave Management", subtitle: "Approve requests & balances" },
  "/payroll": { title: "Payroll", subtitle: "Monthly compensation & disbursals" },
};

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = TITLES[pathname] || { title: "Bindu EMS", subtitle: "" };

  return (
    <div className="relative min-h-screen flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[260px]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenSidebar={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}