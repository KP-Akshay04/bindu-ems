import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  Crown,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  IdCard,
  Waves,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  {
    id: "super_admin",
    label: "Super Admin",
    icon: Crown,
  },
  {
    id: "hr",
    label: "HR",
    icon: Shield,
  },
  {
    id: "employee",
    label: "Employee",
    icon: UserIcon,
  },
];

function DropLogo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id="logoDrop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <path d="M32 4C32 4 10 28 10 42a22 22 0 1 0 44 0C54 28 32 4 32 4Z" fill="url(#logoDrop)" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [role, setRole] = useState("hr");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!employeeId.trim() || !password.trim()) {
      setError("Please enter both Employee ID and Password.");
      return;
    }
    setLoading(true);
    try {
  const loggedInUser = await login({
    employee_id: employeeId.trim(),
    password,
    role,
  });
  // Auto check-in for the day (silently ignored if already checked in)
  try {
  const { attendanceCheckIn } = await import("../services/api");
  await attendanceCheckIn(loggedInUser.employee_id);
} catch (e) {
  // expected when already checked in for the day — ignore
}
  navigate(from, { replace: true });
} 
    catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-b from-[#EAF4FE] via-[#D6EAFB] to-[#A8D2F5]" />
      <svg className="absolute bottom-0 left-0 w-full opacity-40 pointer-events-none" viewBox="0 0 1440 200" fill="none" preserveAspectRatio="none">
        <path d="M0 100 Q360 40 720 100 T1440 100 V200 H0 Z" fill="rgba(255,255,255,0.5)" />
        <path d="M0 140 Q360 80 720 140 T1440 140 V200 H0 Z" fill="rgba(255,255,255,0.35)" />
      </svg>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="flex items-start justify-between px-6 sm:px-10 lg:px-16 pt-8">
          <div className="flex items-center gap-3">
            <DropLogo size={52} />
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">BINDU</span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-500">EMS</span>
              </div>
              <p className="text-[11px] tracking-[0.28em] font-semibold text-slate-500 mt-1">WATER COMPANY</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-600">
            <Waves className="w-5 h-5 text-brand-500" />
            <span className="text-xs sm:text-sm font-semibold tracking-[0.22em]">PURE · TRUSTED · DELIVERED</span>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 sm:px-10 lg:px-16 pt-10 pb-8 items-center">
          <section className="max-w-xl">
            <p className="text-brand-600 font-semibold tracking-[0.22em] text-xs sm:text-sm mb-6">
              ENTERPRISE WORKFORCE PLATFORM
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-slate-900">
              Workforce,
              <br />
              <span className="text-brand-500">precisely</span> managed.
            </h1>
            <p className="mt-6 text-slate-600 text-base sm:text-lg max-w-md leading-relaxed">
              A unified platform to manage attendance, payroll, leaves, and field workforce across all operations with complete transparency.
            </p>
          </section>

          <section className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[440px]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
                <div className="w-16 h-16 rounded-full bg-white shadow-[0_8px_24px_-6px_rgba(2,132,199,0.35)] flex items-center justify-center border border-brand-100">
                  <DropLogo size={36} />
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="relative rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_30px_80px_-30px_rgba(2,132,199,0.35)] px-7 sm:px-9 pt-16 pb-8"
              >
                <div className="text-center mb-7">
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back</h2>
                  <p className="text-slate-500 text-sm mt-1">Sign in to continue</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const active = role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`flex items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-semibold transition-all ${
                          active
                            ? "border-brand-500 bg-brand-50 text-brand-600 shadow-[0_2px_8px_-2px_rgba(14,165,233,0.35)]"
                            : "border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2.2} />
                        {r.label}
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mb-5">
                  <label className="label">Employee ID</label>
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Enter your employee ID"
                      autoComplete="username"
                      className="input h-12 pl-11"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="input h-12 pl-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none mb-6">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>

                <button type="submit" disabled={loading} className="btn-primary w-full h-12 group">
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>
            </div>
          </section>
        </main>

        <footer className="px-6 sm:px-10 lg:px-16 pb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© 2026 Bindu Water Company. All rights reserved.</p>
          <p>Pure · Trusted · Delivered</p>
        </footer>
      </div>
    </div>
  );
}