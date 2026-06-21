import { useEffect, useState } from "react";
import {
  Play,
  Coffee,
  RotateCcw,
  LogOut,
  Clock,
  Sun,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAttendance } from "../context/AttendanceContext";

const fmt = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const fmtTime = (input) => {
  if (!input || input === "None") return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

export default function WorkStatusCard() {
  const { todayRecord, loading, checkIn, lunchOut, lunchIn, checkOut, refresh } = useAttendance();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [shiftTimer, setShiftTimer] = useState("00:00:00");
  const [lunchTimer, setLunchTimer] = useState("00:00:00");

  const status = String(todayRecord?.status ?? "").toLowerCase();
  const isWorking = status === "working";
  const isLunch = status === "lunch break";
  const isCompleted = status === "logged out";
  const notCheckedIn = !todayRecord;

  // ---- Live timers ----
  useEffect(() => {
    if (!todayRecord || isCompleted) return;
    const tick = () => {
      const now = new Date();

      // Shift timer = total - past lunch minutes - current lunch (if any)
      if (todayRecord.login_time) {
        const login = new Date(todayRecord.login_time);
        if (!isNaN(login.getTime())) {
          const totalSec = (now - login) / 1000;
          const pastLunchSec = (Number(todayRecord.lunch_minutes) || 0) * 60;
          let currentLunchSec = 0;
          if (isLunch && todayRecord.lunch_start_time) {
            const ls = new Date(todayRecord.lunch_start_time);
            if (!isNaN(ls.getTime())) currentLunchSec = (now - ls) / 1000;
          }
          setShiftTimer(fmt(totalSec - pastLunchSec - currentLunchSec));
        }
      }

      // Lunch timer = current lunch
      if (isLunch && todayRecord.lunch_start_time) {
        const ls = new Date(todayRecord.lunch_start_time);
        if (!isNaN(ls.getTime())) setLunchTimer(fmt((now - ls) / 1000));
      } else {
        setLunchTimer(fmt((Number(todayRecord.lunch_minutes) || 0) * 60));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [todayRecord, isLunch, isCompleted]);

  const run = async (fn, label) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || `${label} failed.`);
    } finally {
      setBusy(false);
    }
  };

  // ---- Status pill ----
  let pillTone = "bg-slate-100 text-slate-600";
  let pillIcon = <Sun className="w-4 h-4" />;
  let pillText = "Not Checked In";
  if (isWorking) {
    pillTone = "bg-emerald-100 text-emerald-700";
    pillIcon = <Play className="w-4 h-4" />;
    pillText = "Working";
  } else if (isLunch) {
    pillTone = "bg-amber-100 text-amber-700";
    pillIcon = <Coffee className="w-4 h-4" />;
    pillText = "On Lunch Break";
  } else if (isCompleted) {
    pillTone = "bg-brand-100 text-brand-700";
    pillIcon = <CheckCircle2 className="w-4 h-4" />;
    pillText = "Day Completed";
  }

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">My Workday</h3>
          <p className="text-sm text-slate-500">
            Track your check-in, lunch break, and end-of-day in one place.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${pillTone}`}>
          {pillIcon}
          {pillText}
        </span>
      </div>

      {err && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* Live timers */}
      {!notCheckedIn && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-gradient-to-br from-brand-50 to-brand-100/70 p-4 rounded-xl border border-brand-100">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Shift Time</p>
            <p className="text-2xl font-extrabold text-brand-700 font-mono tabular-nums">{shiftTimer}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-100/70 p-4 rounded-xl border border-amber-100">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Lunch Time</p>
            <p className="text-2xl font-extrabold text-amber-600 font-mono tabular-nums">{lunchTimer}</p>
          </div>
        </div>
      )}

      {/* 4 timestamps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stamp label="Login" value={fmtTime(todayRecord?.login_time)} />
        <Stamp label="Lunch Out" value={fmtTime(todayRecord?.lunch_start_time)} />
        <Stamp
          label="Lunch In"
          value={fmtTime(todayRecord?.lunch_end_time)}
          hint={
            todayRecord?.lunch_minutes
              ? `${todayRecord.lunch_minutes} min total`
              : null
          }
        />
        <Stamp
          label="Logout"
          value={fmtTime(todayRecord?.logout_time)}
          hint={
            todayRecord?.working_hours
              ? `${todayRecord.working_hours} hrs worked`
              : null
          }
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {notCheckedIn && (
          <button
            onClick={() => run(checkIn, "Check-in")}
            disabled={busy || loading}
            className="btn-primary"
          >
            <Play className="w-4 h-4" /> {busy ? "Checking in..." : "Check In"}
          </button>
        )}

        {isWorking && (
          <>
            <button
              onClick={() => run(lunchOut, "Lunch out")}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-[0_8px_24px_-10px_rgba(245,158,11,0.55)] disabled:opacity-60"
            >
              <Coffee className="w-4 h-4" /> Start Lunch Break
            </button>
            <button
              onClick={() => run(checkOut, "Check-out")}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-[0_8px_24px_-10px_rgba(244,63,94,0.5)] disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" /> End Workday
            </button>
          </>
        )}

        {isLunch && (
          <button
            onClick={() => run(lunchIn, "Lunch in")}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-[0_8px_24px_-10px_rgba(16,185,129,0.55)] disabled:opacity-60"
          >
            <RotateCcw className="w-4 h-4" /> Back to Working
          </button>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Workday completed — see you tomorrow!
          </div>
        )}

        {!notCheckedIn && !isCompleted && (
          <button onClick={refresh} className="btn-secondary" disabled={busy}>
            <Clock className="w-4 h-4" /> Refresh
          </button>
        )}
      </div>
    </div>
  );
}

function Stamp({ label, value, hint }) {
  return (
    <div className="px-3 py-2.5 bg-white/70 border border-slate-200 rounded-xl">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
      <p className="text-sm font-bold text-slate-800 font-mono">{value}</p>
      {hint && <p className="text-[11px] text-brand-600 font-semibold mt-0.5">{hint}</p>}
    </div>
  );
}