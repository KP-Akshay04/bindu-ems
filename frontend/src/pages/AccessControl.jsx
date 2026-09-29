import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Building2,
  ClipboardCheck,
  CalendarRange,
  Wallet,
  Bell,
  Clock3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LockKeyhole,
  Settings2,
  ArrowLeft,
} from "lucide-react";

import {
  fetchAccessControl,
  updateAccessControl,
} from "../services/api";

const ICONS = {
  hr_dashboard: ShieldCheck,
  hr_depot_employees: Users,
  hr_depot_managers: Building2,
  hr_attendance: ClipboardCheck,
  hr_leaves: CalendarRange,
  hr_payroll: Wallet,
  hr_announcements: Bell,
  hr_shifts: Clock3,
};

const ICON_BACKGROUNDS = {
  hr_dashboard: "bg-blue-50 text-blue-600",
  hr_depot_employees: "bg-violet-50 text-violet-600",
  hr_depot_managers: "bg-amber-50 text-amber-600",
  hr_attendance: "bg-emerald-50 text-emerald-600",
  hr_leaves: "bg-orange-50 text-orange-600",
  hr_payroll: "bg-cyan-50 text-cyan-600",
  hr_announcements: "bg-pink-50 text-pink-600",
  hr_shifts: "bg-indigo-50 text-indigo-600",
};

export default function AccessControl() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchAccessControl();

      setPermissions(
        Array.isArray(data.permissions)
          ? data.permissions
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load access control:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load access control settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleToggle = async (
    permissionKey,
    currentEnabled
  ) => {
    try {
      setUpdating(permissionKey);
      setError("");

      const data = await updateAccessControl(
        permissionKey,
        "HR",
        !currentEnabled
      );

      const updatedPermission =
        data.permission;

      setPermissions((current) =>
        current.map((permission) =>
          permission.permission_key ===
          permissionKey
            ? {
                ...permission,
                roles: {
                  ...permission.roles,
                  HR: updatedPermission.enabled,
                },
              }
            : permission
        )
      );
    } catch (err) {
      console.error(
        "Failed to update access control:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update access control."
      );
    } finally {
      setUpdating(null);
    }
  };

  const totalPermissions = permissions.length;

  const enabledPermissions = useMemo(
    () =>
      permissions.filter(
        (permission) =>
          Boolean(permission.roles?.HR)
      ).length,
    [permissions]
  );

  const disabledPermissions =
    totalPermissions - enabledPermissions;

  const accessPercentage =
    totalPermissions > 0
      ? Math.round(
          (enabledPermissions /
            totalPermissions) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
          </div>

          <span className="text-sm font-medium">
            Loading access control...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">



    {/* Back Button */}
<button
  type="button"
  onClick={() => navigate("/dashboard")}
  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-[0.98]"
>
  <ArrowLeft className="w-4 h-4" />
  Back to Dashboard
</button>



      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-brand-50/70 blur-3xl" />
        <div className="absolute -left-20 -bottom-24 w-64 h-64 rounded-full bg-blue-50/60 blur-3xl" />

        <div className="relative p-6 md:p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-brand-600" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                    Administration
                  </span>

                  <span className="w-1 h-1 rounded-full bg-slate-300" />

                  <span className="text-xs font-medium text-slate-400">
                    Security
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  Access Control
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage which management modules are
                  available to the HR role. Changes take
                  effect immediately across the system.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                <LockKeyhole className="w-4 h-4 text-slate-500" />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  HR Access
                </p>

                <p className="text-sm font-bold text-slate-800">
                  {accessPercentage}% enabled
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

          <div>
            <p className="text-sm font-semibold">
              Access control update failed
            </p>

            <p className="text-sm mt-0.5 text-rose-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Total */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Permissions
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalPermissions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Available HR modules
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Enabled */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Enabled
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {enabledPermissions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Currently accessible by HR
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Disabled */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Disabled
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {disabledPermissions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Restricted from HR
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

      </div>

      {/* =====================================================
          PERMISSION MANAGEMENT
      ====================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Section Header */}
        <div className="px-5 py-5 md:px-6 border-b border-slate-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-600" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  HR Management Access
                </h2>

                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Enable or disable individual modules
                  available to HR personnel.
                </p>
              </div>
            </div>

            <div className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-semibold text-slate-600">
                HR Role
              </span>
            </div>

          </div>
        </div>

        {/* Column Labels */}
        <div className="hidden md:grid grid-cols-[1fr_150px] items-center px-6 py-3 bg-slate-50/70 border-b border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Management Module
          </span>

          <span className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            HR Access
          </span>
        </div>

        {/* Permission Rows */}
        <div className="divide-y divide-slate-100">

          {permissions.map((permission) => {
            const Icon =
              ICONS[permission.permission_key] ||
              ShieldCheck;

            const enabled = Boolean(
              permission.roles?.HR
            );

            const isUpdating =
              updating === permission.permission_key;

            const iconStyle =
              ICON_BACKGROUNDS[
                permission.permission_key
              ] || "bg-slate-50 text-slate-500";

            return (
              <div
                key={permission.permission_id}
                className={`group px-5 py-5 md:px-6 transition-colors duration-200 ${
                  enabled
                    ? "hover:bg-slate-50/60"
                    : "hover:bg-slate-50/40"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] items-center gap-4">

                  {/* Module */}
                  <div className="flex items-center gap-4 min-w-0">

                    <div
                      className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${iconStyle}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-800">
                          {permission.permission_name}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            enabled
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              enabled
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />

                          {enabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>

                      {permission.description && (
                        <p className="mt-1 text-xs sm:text-sm leading-5 text-slate-500 max-w-2xl">
                          {permission.description}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Toggle */}
                  <div className="flex items-center justify-between md:justify-center">

                    <span className="md:hidden text-xs font-semibold text-slate-400">
                      HR Access
                    </span>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        handleToggle(
                          permission.permission_key,
                          enabled
                        )
                      }
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-4 ${
                        enabled
                          ? "bg-brand-500 focus:ring-brand-100"
                          : "bg-slate-300 focus:ring-slate-100"
                      } ${
                        isUpdating
                          ? "opacity-60 cursor-wait"
                          : "cursor-pointer hover:shadow-sm"
                      }`}
                      aria-label={`${
                        enabled
                          ? "Disable"
                          : "Enable"
                      } ${
                        permission.permission_name
                      } for HR`}
                      aria-pressed={enabled}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                          enabled
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />

                      {isUpdating && (
                        <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 text-slate-500 animate-spin" />
                      )}
                    </button>

                  </div>

                </div>
              </div>
            );
          })}

        </div>

        {/* Empty State */}
        {permissions.length === 0 && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-slate-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              No permissions found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              No access-control permissions are
              currently configured.
            </p>
          </div>
        )}

        {/* Footer */}
        {permissions.length > 0 && (
          <div className="px-5 py-4 md:px-6 border-t border-slate-100 bg-slate-50/50">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Changes are saved automatically.
              </p>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  Super Admin controlled
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}