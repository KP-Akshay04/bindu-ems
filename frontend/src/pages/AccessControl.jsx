import { useEffect, useState } from "react";
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

export default function AccessControl() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading access control...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-brand-600" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Access Control
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Control which management features are
              available to HR.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />

          <p className="text-sm font-medium">
            {error}
          </p>
        </div>
      )}

      {/* Permission List */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="grid grid-cols-[1fr_120px] items-center">
            <div>
              <h3 className="font-semibold text-slate-800">
                HR Permissions
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Enable or disable individual HR modules.
              </p>
            </div>

            <div className="text-center text-xs font-semibold text-slate-500">
              HR ACCESS
            </div>
          </div>
        </div>

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

            return (
              <div
                key={permission.permission_id}
                className="px-6 py-5 grid grid-cols-[1fr_120px] items-center gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-500" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {permission.permission_name}
                    </h4>

                    {permission.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {permission.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() =>
                      handleToggle(
                        permission.permission_key,
                        enabled
                      )
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                      enabled
                        ? "bg-brand-500"
                        : "bg-slate-300"
                    } ${
                      isUpdating
                        ? "opacity-60 cursor-wait"
                        : "cursor-pointer"
                    }`}
                    aria-label={`${
                      enabled
                        ? "Disable"
                        : "Enable"
                    } ${
                      permission.permission_name
                    } for HR`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
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
            );
          })}
        </div>

        {permissions.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            No access-control permissions found.
          </div>
        )}
      </div>
    </div>
  );
}