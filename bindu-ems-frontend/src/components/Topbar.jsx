import { useEffect, useRef, useState } from "react";
import { Bell, Search, Menu, ChevronDown, Settings, LogOut, UserCircle2 } from "lucide-react";
import { fetchAnnouncements } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/format";

export default function Topbar({ title, subtitle, onOpenSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
  const handler = (e) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target)
    ) {
      setMenuOpen(false);
      setNotificationsOpen(false);
    }
  };

  document.addEventListener(
    "mousedown",
    handler
  );

  const loadAnnouncements =
    async () => {
      try {
        const data =
          await fetchAnnouncements();

        setAnnouncements(
          data.slice(0, 5)
        );
      } catch (err) {
        console.error(err);
      }
    };

  loadAnnouncements();

  return () =>
    document.removeEventListener(
      "mousedown",
      handler
    );
}, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const name =
  user?.full_name ||
  user?.name ||
  user?.employee_code ||
  "User";
  const role = user?.role || "Member";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16 bg-white/70 backdrop-blur-xl border-b border-brand-100">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="lg:hidden btn-ghost text-slate-600 w-10 h-10"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden sm:block">
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center w-72 lg:w-96 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Search employees, requests, payslips..."
          className="input h-10 pl-10"
        />
      </div>

      <div className="relative">
  <button
    onClick={() =>
      setNotificationsOpen(
        !notificationsOpen
      )
    }
    className="relative w-10 h-10 btn-ghost text-slate-600"
    aria-label="Notifications"
  >
    <Bell className="w-5 h-5" />

    {announcements.length > 0 && (
      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
    )}
  </button>

  {notificationsOpen && (
    <div className="absolute right-0 mt-2 w-80 glass-card p-3 z-50">
      <h3 className="font-bold text-slate-800 mb-3">
        Recent Announcements
      </h3>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-sm text-slate-500">
            No announcements
          </p>
        ) : (
          announcements.map((a) => (
            <div
              key={a.announcement_id}
              className="border-b border-slate-100 pb-2"
            >
              <p className="font-medium text-slate-800">
                {a.title}
              </p>

              <p className="text-xs text-slate-500 mt-1">
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
  )}
</div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((s) => !s)}
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-brand-50 transition-colors"
        >
          {user?.employee_photo ? (
  <img
    src={`http://127.0.0.1:5000/${user.employee_photo.replace(/\\/g, "/")}`}
    alt="Profile"
    className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100"
  />
) : (
  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-brand-100 bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold">
    {initials(name)}
  </span>
)}

          <span className="hidden sm:block text-left leading-tight">
            <p className="text-sm font-semibold text-slate-800 max-w-[140px] truncate">{name}</p>
            <p className="text-[11px] text-brand-600 font-semibold uppercase tracking-wider">{role}</p>
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
        </button>

        {menuOpen && (
  <div className="absolute right-0 mt-2 w-60 glass-card p-1.5 z-40">
    <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-3">
      {user?.employee_photo ? (
        <img
          src={`http://127.0.0.1:5000/${user.employee_photo.replace(/\\/g, "/")}`}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold">
          {initials(name)}
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-slate-800 truncate">
          {name}
        </p>

        <p className="text-xs text-slate-500 truncate">
          {user?.email || user?.employee_id}
        </p>
      </div>
    </div>

    <button
      onClick={() => {
        setMenuOpen(false);
        navigate("/profile");
      }}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-brand-50"
    >
      <UserCircle2 className="w-4 h-4" />
      My Profile
    </button>

    <button
      onClick={() => {
        setMenuOpen(false);
        navigate("/settings");
      }}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-brand-50"
    >
      <Settings className="w-4 h-4" />
      Settings
    </button>

    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  </div>
)}


      </div>
    </header>
  );
}