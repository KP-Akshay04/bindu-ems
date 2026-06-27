import { X, Mail, Phone, Calendar, Briefcase, Building2, User, BadgeCheck } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDate, initials } from "../utils/format";

export default function EmployeeProfileDialog({
  open,
  employee,
  onClose,
}) {
  if (!open || !employee) return null;

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

            {/* Avatar */}

            <div className="w-28 h-28 rounded-full bg-white/20 ring-4 ring-white/30 flex items-center justify-center text-3xl font-bold">

              {employee.employee_photo ? (
                <img
                  src={employee.employee_photo}
                  alt={employee.full_name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                initials(employee.full_name)
              )}

            </div>

            {/* Basic Information */}

            <div className="flex-1">

              <h2 className="text-3xl font-bold">
                {employee.full_name}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">

                <span>
                  Employee ID :
                  <strong className="ml-1">
                    {employee.employee_id}
                  </strong>
                </span>

                <span>•</span>

                <span>
                  Code :
                  <strong className="ml-1">
                    {employee.employee_code}
                  </strong>
                </span>

              </div>

              <div className="mt-4">
                <StatusBadge
                  status={employee.status ?? "Active"}
                />
              </div>

            </div>

          </div>

        </div>

        {/* Body */}

        <div className="max-h-[65vh] overflow-y-auto p-8 space-y-8">

          {/* Personal Details */}

          <section>

            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">

              <User className="w-5 h-5 text-brand-600" />

              Personal Information

            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <InfoCard
                icon={<Building2 className="w-5 h-5 text-brand-600" />}
                label="Department"
                value={employee.department ?? "—"}
              />

              <InfoCard
                icon={<Briefcase className="w-5 h-5 text-brand-600" />}
                label="Designation"
                value={employee.designation ?? "—"}
              />

              <InfoCard
                icon={<BadgeCheck className="w-5 h-5 text-brand-600" />}
                label="Role"
                value={employee.role ?? "Employee"}
              />

              <InfoCard
                icon={<Calendar className="w-5 h-5 text-brand-600" />}
                label="Joining Date"
                value={formatDate(
                  employee.joined_date ??
                  employee.created_at
                )}
              />

            </div>

          </section>

          {/* Contact Information */}

          <section>

            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">

              <Phone className="w-5 h-5 text-brand-600" />

              Contact Information

            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <InfoCard
                icon={<Mail className="w-5 h-5 text-brand-600" />}
                label="Email"
                value={employee.email ?? "—"}
              />

              <InfoCard
                icon={<Phone className="w-5 h-5 text-brand-600" />}
                label="Phone Number"
                value={employee.phone ?? "—"}
              />

            </div>

          </section>

          {/* Work Information */}

          <section>

            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">

              <Briefcase className="w-5 h-5 text-brand-600" />

              Work Information

            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <InfoCard
                icon={<Building2 className="w-5 h-5 text-brand-600" />}
                label="Branch"
                value={employee.branch ?? "Not Assigned"}
              />

              <InfoCard
                icon={<Calendar className="w-5 h-5 text-brand-600" />}
                label="Shift"
                value={employee.shift_name ?? "Not Assigned"}
              />

              <InfoCard
                icon={<BadgeCheck className="w-5 h-5 text-brand-600" />}
                label="Employee Status"
                value={employee.status ?? "Active"}
              />

              <InfoCard
                icon={<User className="w-5 h-5 text-brand-600" />}
                label="Employee Code"
                value={employee.employee_code}
              />

            </div>

          </section>

        </div>

        {/* Footer */}

        <div className="border-t border-slate-200 px-8 py-5 flex justify-end bg-slate-50">

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

/* ------------------------------------------------ */

function InfoCard({
  icon,
  label,
  value,
}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all duration-300">

      <div className="flex items-center gap-3">

        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">

          {icon}

        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">

            {label}

          </p>

          <p className="text-sm font-semibold text-slate-800 mt-1">

            {value}

          </p>

        </div>

      </div>

    </div>

  );

}