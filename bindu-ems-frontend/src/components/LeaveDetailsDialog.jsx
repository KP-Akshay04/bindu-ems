import {
  X,
  User,
  Calendar,
  CalendarDays,
  Briefcase,
  Building2,
  BadgeCheck,
  Clock3,
} from "lucide-react";

import StatusBadge from "./StatusBadge";
import { formatDate, initials } from "../utils/format";

export default function LeaveDetailsDialog({
  open,
  leave,
  onClose,
  onApprove,
  onReject,
  canManage = false,
}) {
  if (!open || !leave) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">

      <div className="glass-card w-full max-w-4xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Header */}

        <div className="relative bg-gradient-to-r from-brand-600 via-sky-600 to-cyan-600 px-8 py-10 text-white">

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row items-center gap-6">

            <div className="w-24 h-24 rounded-full bg-white/20 ring-4 ring-white/30 flex items-center justify-center text-3xl font-bold">

              {initials(
                leave.employee_name ??
                leave.full_name ??
                "Employee"
              )}

            </div>

            <div className="flex-1">

              <h2 className="text-3xl font-bold">

                {leave.employee_name ??
                 leave.full_name}

              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">

                <span>

                  Employee ID :

                  <strong className="ml-1">

                    {leave.employee_id}

                  </strong>

                </span>

                <span>•</span>

                <span>

                  {leave.employee_code}

                </span>

              </div>

              <div className="mt-4">

                <StatusBadge
                  status={leave.status}
                />

              </div>

            </div>

          </div>

        </div>

        {/* Body */}

        <div className="max-h-[65vh] overflow-y-auto p-8 space-y-8">

          {/* Employee Information */}

          <section>

            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">

              <User className="w-5 h-5 text-brand-600" />

              Employee Information

            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <InfoCard
                icon={<Building2 className="w-5 h-5 text-brand-600" />}
                label="Department"
                value={leave.department ?? "—"}
              />

              <InfoCard
                icon={<Briefcase className="w-5 h-5 text-brand-600" />}
                label="Designation"
                value={leave.designation ?? "—"}
              />

              <InfoCard
                icon={<BadgeCheck className="w-5 h-5 text-brand-600" />}
                label="Leave Type"
                value={leave.leave_type}
              />

              <InfoCard
                icon={<Clock3 className="w-5 h-5 text-brand-600" />}
                label="Duration"
                value={`${leave.duration ?? 0} Day${leave.duration > 1 ? "s" : ""}`}
              />

            </div>

          </section>

                    {/* Leave Information */}

          <section>

            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">

              <CalendarDays className="w-5 h-5 text-brand-600" />

              Leave Information

            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <InfoCard
                icon={<Calendar className="w-5 h-5 text-brand-600" />}
                label="From Date"
                value={formatDate(leave.start_date)}
              />

              <InfoCard
                icon={<Calendar className="w-5 h-5 text-brand-600" />}
                label="To Date"
                value={formatDate(leave.end_date)}
              />

              <InfoCard
                icon={<CalendarDays className="w-5 h-5 text-brand-600" />}
                label="Applied On"
                value={formatDate(
                  leave.created_at ??
                  leave.applied_date
                )}
              />

              <InfoCard
                icon={<BadgeCheck className="w-5 h-5 text-brand-600" />}
                label="Current Status"
                value={leave.status}
              />

            </div>

          </section>

          {/* Reason */}

          <section>

            <h3 className="text-lg font-bold text-slate-800 mb-5">

              Reason

            </h3>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <p className="text-slate-700 leading-7">

                {leave.reason || "No reason provided."}

              </p>

            </div>

          </section>

        </div>

        {/* Footer */}

        <div className="border-t border-slate-200 px-8 py-5 flex justify-between items-center bg-slate-50">

          <div>

            {canManage && leave.status === "Pending" && (

              <div className="flex gap-3">

                <button
                  onClick={() => onApprove?.(leave.leave_id)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                >
                  Approve
                </button>

                <button
                  onClick={() => onReject?.(leave.leave_id)}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                >
                  Reject
                </button>

              </div>

            )}

          </div>

          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>

        </div>

      </div>

    </div>

  );

}

/* ---------------------------------------------------------- */

function InfoCard({
  icon,
  label,
  value,
}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition">

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">

          {icon}

        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">

            {label}

          </p>

          <p className="text-sm font-semibold text-slate-800 mt-1">

            {value ?? "—"}

          </p>

        </div>

      </div>

    </div>

  );

}