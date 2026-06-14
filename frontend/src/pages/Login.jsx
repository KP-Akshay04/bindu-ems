import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  IdCard,
  CalendarDays,
  IndianRupee,
  MapPin,
  UserCheck,
  Building2,
  Heart,
  Waves,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { toast, Toaster } from "sonner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ROLES = [
  { id: "hr", label: "HR", icon: Shield },
  { id: "manager", label: "Manager", icon: Users },
  { id: "employee", label: "Employee", icon: UserIcon },
];

const FEATURES = [
  { label: "Smart\nAttendance", icon: UserCheck },
  { label: "Leave\nManagement", icon: CalendarDays },
  { label: "Payroll\nProcessing", icon: IndianRupee },
  { label: "Field\nTracking", icon: MapPin },
];

const STATS = [
  { value: "500+", label: "Employees", icon: Users },
  { value: "12", label: "Departments", icon: Building2 },
  { value: "99.8%", label: "Attendance Accuracy", icon: Shield },
];

const WaterDropLogo = ({ size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <defs>
      <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <path
      d="M32 4C32 4 10 28 10 42a22 22 0 1 0 44 0C54 28 32 4 32 4Z"
      fill="url(#dropGrad)"
    />
    <path
      d="M22 40c0 8 6 14 14 14"
      stroke="#ffffff"
      strokeOpacity="0.55"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const FeatureCard = ({ icon: Icon, label }) => (
  <div
    data-testid={`feature-${label.split("\n").join("-").toLowerCase()}`}
    className="flex flex-col items-center justify-center w-[125px] h-[130px] rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_4px_24px_-8px_rgba(29,78,216,0.18)] hover:-translate-y-1 transition-transform duration-300"
  >
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mb-3 shadow-md">
      <Icon className="w-6 h-6 text-white" strokeWidth={2.2} />
    </div>
    <p className="text-[13px] font-medium text-slate-700 text-center leading-tight whitespace-pre-line">
      {label}
    </p>
  </div>
);

export default function LoginPage() {
  const [role, setRole] = useState("hr");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
e.preventDefault();

if (!employeeId.trim() || !password.trim()) {
toast.error("Please enter both Employee ID and Password");
return;
}

setLoading(true);

try {
const payload = {
employee_id: employeeId.trim(),
password,
};


const response = await axios.post(
  "http://127.0.0.1:5000/api/auth/login",
  payload
);

if (response.data.success) {

  localStorage.setItem(
    "employee",
    JSON.stringify(response.data)
  );

  toast.success("Login Successful", {
    description: `Welcome ${response.data.full_name}`,
  });

  navigate("/dashboard");

}

} catch (err) {


toast.error(
  err.response?.data?.message ||
  "Invalid Employee ID or Password"
);


} finally {
setLoading(false);
}
};


  return (
    <div
      data-testid="login-page"
      className="relative min-h-screen w-full overflow-hidden font-[Manrope,sans-serif] text-slate-900"
    >
      {/* Water background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5FAFF] via-[#EAF4FE] to-[#CFE7FB]" />
      <div
        className="absolute inset-0 opacity-15 mix-blend-screen pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=2400&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-[#7FBDEE]/40" />

      {/* Subtle wave overlays */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-20 pointer-events-none"
        viewBox="0 0 1440 200"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 100 Q360 40 720 100 T1440 100 V200 H0 Z"
          fill="rgba(255,255,255,0.5)"
        />
        <path
          d="M0 140 Q360 80 720 140 T1440 140 V200 H0 Z"
          fill="rgba(255,255,255,0.35)"
        />
      </svg>

      {/* Page content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-start justify-between px-6 sm:px-10 lg:px-16 pt-8">
          <div className="flex items-center gap-3" data-testid="brand-logo">
            <WaterDropLogo size={52} />
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  BINDU
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sky-500">
                  EMS
                </span>
              </div>
              <p className="text-[11px] tracking-[0.28em] font-semibold text-slate-500 mt-1">
                WATER COMPANY
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-600">
            <Waves className="w-5 h-5 text-sky-500" />
            <span className="text-xs sm:text-sm font-semibold tracking-[0.22em]">
              PURE · TRUSTED · DELIVERED
            </span>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 px-12 lg:px-20 py-10 items-center max-w-[1600px] mx-auto w-full">
          {/* Left panel */}
          <section className="max-w-[700px]">
            <p className="text-sky-600 font-semibold tracking-[0.22em] text-xs sm:text-sm mb-6">
              ENTERPRISE WORKFORCE PLATFORM
            </p>
            <h1 className="text-5xl lg:text-[68px] font-extrabold tracking-tight leading-[1.05] text-slate-900">
              Workforce,
              <br />
              <span className="text-sky-500">precisely</span> managed.
            </h1>
            <p className="mt-6 text-slate-600 text-base sm:text-lg max-w-md leading-relaxed">
              A unified platform to manage attendance, payroll, leaves, and
              field workforce across all operations with complete transparency.
            </p>

            {/* Features */}
            <div className="mt-4 flex flex-wrap gap-4">
              {FEATURES.map((f) => (
                <FeatureCard key={f.label} {...f} />
              ))}
            </div>
          </section>

          {/* Right - login card */}
          <section className="flex justify-center lg:justify-center mt-16">
            <div className="relative w-full max-w-[580px]">
              {/* Floating logo */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
                <div className="w-16 h-16 rounded-full bg-white shadow-[0_8px_24px_-6px_rgba(29,78,216,0.35)] flex items-center justify-center border border-sky-100">
                  <WaterDropLogo size={36} />
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                data-testid="login-form"
                className="relative rounded-[32px] bg-white/95 border border-white/70 shadow-[0_30px_100px_-20px_rgba(29,78,216,0.25)] px-10 pt-16 pb-10"
              >
                <div className="text-center mb-7">
                  <h2 className="text-[52px] font-extrabold tracking-tight text-slate-900 leading-none">
                    Welcome Back
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Sign in to continue
                  </p>
                </div>

                {/* Role tabs */}
                <div
                  className="grid grid-cols-3 gap-2 mb-6"
                  data-testid="role-selector"
                  role="tablist"
                >
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const active = role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        data-testid={`role-${r.id}`}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setRole(r.id)}
                        className={`flex items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "border-sky-500 bg-sky-50 text-sky-600 shadow-[0_2px_8px_-2px_rgba(14,165,233,0.35)]"
                            : "border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2.2} />
                        {r.label}
                      </button>
                    );
                  })}
                </div>

                {/* Employee ID */}
                <div className="mb-5">
                  <label
                    htmlFor="employeeId"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Employee ID
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <Input
                      id="employeeId"
                      data-testid="employee-id-input"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Enter your employee ID"
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-slate-700"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <Input
                      id="password"
                      data-testid="password-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-12 pl-12 pr-12 rounded-xl border border-slate-200 bg-white text-slate-700"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      data-testid="toggle-password-visibility"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center mb-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      id="remember"
                      data-testid="remember-me-checkbox"
                      checked={remember}
                      onCheckedChange={(v) => setRemember(Boolean(v))}
                      className="border-slate-300 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  data-testid="sign-in-button"
                  disabled={loading}
                  className="group w-full h-12 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 hover:from-sky-500 hover:via-blue-600 hover:to-blue-800 shadow-[0_10px_30px_-10px_rgba(29,78,216,0.6)] transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? "Signing in..." : "Sign In"}
                    {!loading && (
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    )}
                  </span>
                </Button>
              </form>
            </div>
          </section>
        </main>

        {/* Stats bar */}
        <div className="px-6 sm:px-10 lg:px-16 pb-12">
          <div
            data-testid="stats-bar"
            className="flex flex-wrap items-center gap-10 rounded-2xl bg-white/75 backdrop-blur-md border border-white/70 shadow-[0_12px_40px_-20px_rgba(29,78,216,0.25)] px-7 py-4"
          >
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-3"
                  data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div className="leading-tight">
                    <p className="text-xl font-extrabold text-sky-600">
                      {s.value}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 sm:px-10 lg:px-16 pb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p data-testid="footer-copyright">
            © 2026 Bindu Water Company. All rights reserved.
          </p>
        </footer>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
