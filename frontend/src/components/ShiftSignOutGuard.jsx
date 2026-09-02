import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";
import { useAttendance } from "../context/AttendanceContext";

/**
 * Hook that returns:
 *   - requestSignOut() : call when user clicks "Sign Out"
 *   - <ShiftSignOutDialog /> : JSX to render alongside (handles the prompt)
 */
export function useShiftSignOut() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isOnShift, checkOut } = useAttendance();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const performSignOut = () => {
    logout();
    navigate("/login");
  };

  const requestSignOut = () => {
    setErr("");
    if (isOnShift) setOpen(true);
    else performSignOut();
  };

  const handleEndAndSignOut = async () => {
    setBusy(true);
    setErr("");
    try {
      await checkOut();
      setOpen(false);
      performSignOut();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Could not end workday.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOutAnyway = () => {
    setOpen(false);
    performSignOut();
  };

  const Dialog = (
    <Modal
      open={open}
      onClose={() => !busy && setOpen(false)}
      title="You're still on shift"
      description="Your workday hasn't been ended yet. What would you like to do?"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            If you sign out without ending your workday, your shift will remain open
            and your working hours will not be calculated.
          </p>
        </div>

        {err && (
          <p className="text-sm text-rose-600">{err}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
          <button
            onClick={() => setOpen(false)}
            disabled={busy}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSignOutAnyway}
            disabled={busy}
            className="btn-secondary"
          >
            Sign Out Anyway
          </button>
          <button
            onClick={handleEndAndSignOut}
            disabled={busy}
            className="btn-primary"
          >
            {busy ? "Ending workday..." : "End Workday & Sign Out"}
          </button>
        </div>
      </div>
    </Modal>
  );

  return { requestSignOut, Dialog };
}