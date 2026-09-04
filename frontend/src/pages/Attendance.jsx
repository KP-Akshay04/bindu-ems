import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  UserCheck,
  UserX,
  Clock,
  CalendarOff,
  Search,
  Download,
  Upload,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import BranchFilter from "../components/BranchFilter";

import { fetchAttendance } from "../services/api";
import {
  extractList,
  formatDate,
  formatTime,
  formatDuration,
  initials,
} from "../utils/format";
import { getBranches } from "../services/branchService";


export default function Attendance({
  myRecordsOnly = false,
}) {
  const { user } = useAuthSafe();
  const location = useLocation();

  const isMyAttendance =
    location.pathname === "/my-attendance";

  const isManagement =
    !isMyAttendance &&
    (
      user?.role === "Super Admin" ||
      user?.role === "HR"
    );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);

  const [tab, setTab] = useState("today");

  const [query, setQuery] = useState("");

  const [selectedBranch, setSelectedBranch] =
    useState("All");

  const [selectedDepartment, setSelectedDepartment] =
    useState("All");

  const [selectedDesignation, setSelectedDesignation] =
    useState("All");

  const [selectedStatus, setSelectedStatus] =
    useState("All");

  const [dateFrom, setDateFrom] = useState("");

  const [dateTo, setDateTo] = useState("");

  const [importing, setImporting] = useState(false);

  const [importMessage, setImportMessage] =
    useState(null);

  const [exporting, setExporting] = useState(false);

  const fileInputRef = useRef(null);


  // ==========================================================
  // DERIVED FILTER OPTIONS
  // ==========================================================

  const departments = useMemo(() => {
    return [
      ...new Set(
        items
          .map((x) => x.department_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [items]);


  const designations = useMemo(() => {
    return [
      ...new Set(
        items
          .map((x) => x.designation_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [items]);


  const statuses = [
    "Present",
    "Late",
    "Working",
    "Lunch Break",
    "Completed",
    "Early Logout",
    "Logged Out",
    "Absent",
    "Leave",
  ];


  // ==========================================================
  // LOAD ATTENDANCE
  // ==========================================================

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (
        isMyAttendance ||
        user?.role === "Employee"
      ) {
        params.employee_id =
          user.employee_id;
      } else {
        if (dateFrom) {
          params.date_from = dateFrom;
        }

        if (dateTo) {
          params.date_to = dateTo;
        }

        if (selectedStatus !== "All") {
          params.status = selectedStatus;
        }
      }

      const [data, branchRes] =
        await Promise.all([
          fetchAttendance(params),
          getBranches(),
        ]);

      setBranches(
        branchRes?.data || []
      );

      setItems(
        extractList(
          data,
          "attendance"
        )
      );

    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (user) {
      load();
    }
  }, [
    user,
    dateFrom,
    dateTo,
    selectedStatus,
  ]);


  // ==========================================================
  // TODAY
  // ==========================================================

  const now = new Date();

  const today =
    now.getFullYear() +
    "-" +
    String(
      now.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      now.getDate()
    ).padStart(2, "0");


  const todayList = useMemo(
    () =>
      items.filter(
        (a) =>
          String(
            a.attendance_date ??
            a.date ??
            a.created_at ??
            ""
          ).slice(0, 10) === today
      ),
    [items, today]
  );


  // ==========================================================
  // COUNTS
  // ==========================================================

  const counts = useMemo(() => {
    const c = {
      present: 0,
      late: 0,
      absent: 0,
      leave: 0,
    };

    todayList.forEach((a) => {
      const s = String(
        a.status ?? ""
      )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");


      if (
        [
          "working",
          "present",
          "late",
          "lunch break",
          "completed",
          "early logout",
          "logged out",
          "checked-in",
        ].includes(s)
      ) {
        c.present++;
      }


      if (s === "late") {
        c.late++;
      }


      if (s === "absent") {
        c.absent++;
      }


      if (
        [
          "leave",
          "on leave",
        ].includes(s)
      ) {
        c.leave++;
      }
    });

    return c;
  }, [todayList]);


  // ==========================================================
  // WEEKLY TREND
  // ==========================================================

  const trend = useMemo(() => {
    const buckets = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ].map((day) => ({
      day,
      present: 0,
    }));


    items.forEach((a) => {
      const dt = new Date(
        a.attendance_date ??
        a.date ??
        a.created_at ??
        0
      );

      if (isNaN(dt.getTime())) {
        return;
      }


      const idx =
        (dt.getDay() + 6) % 7;


      const s = String(
        a.status ?? ""
      )
        .trim()
        .toLowerCase();


      if (
        [
          "present",
          "working",
          "late",
          "lunch break",
          "completed",
          "early logout",
          "checked-in",
          "logged out",
        ].includes(s)
      ) {
        buckets[idx].present += 1;
      }
    });


    return buckets;
  }, [items]);


  // ==========================================================
  // FILTER DISPLAY
  // ==========================================================

  const visible = useMemo(() => {
    const source =
      tab === "today"
        ? todayList
        : items;


    return source.filter((a) => {
      const q =
        query
          .toLowerCase()
          .trim();


      const matchesSearch =
        !q ||
        String(
          a.employee_name ?? ""
        )
          .toLowerCase()
          .includes(q) ||

        String(
          a.employee_code ?? ""
        )
          .toLowerCase()
          .includes(q) ||

        String(
          a.employee_id ?? ""
        )
          .toLowerCase()
          .includes(q) ||

        String(
          a.department_name ?? ""
        )
          .toLowerCase()
          .includes(q) ||

        String(
          a.designation_name ?? ""
        )
          .toLowerCase()
          .includes(q) ||

        String(
          a.branch_name ?? ""
        )
          .toLowerCase()
          .includes(q);


      const matchesBranch =
        selectedBranch === "All" ||
        a.branch_name ===
          selectedBranch;


      const matchesDepartment =
        selectedDepartment === "All" ||
        a.department_name ===
          selectedDepartment;


      const matchesDesignation =
        selectedDesignation === "All" ||
        a.designation_name ===
          selectedDesignation;


      const matchesStatus =
        selectedStatus === "All" ||
        String(
          a.status ?? ""
        ).trim().toLowerCase() ===
          selectedStatus
            .trim()
            .toLowerCase();


      return (
        matchesSearch &&
        matchesBranch &&
        matchesDepartment &&
        matchesDesignation &&
        matchesStatus
      );
    });
  }, [
    items,
    todayList,
    tab,
    query,
    selectedBranch,
    selectedDepartment,
    selectedDesignation,
    selectedStatus,
  ]);


  // ==========================================================
  // BUILD QUERY FOR EXPORT
  // ==========================================================

  const buildReportQuery = () => {
    const params =
      new URLSearchParams();


    if (dateFrom) {
      params.set(
        "date_from",
        dateFrom
      );
    }


    if (dateTo) {
      params.set(
        "date_to",
        dateTo
      );
    }


    if (
      selectedStatus !== "All"
    ) {
      params.set(
        "status",
        selectedStatus
      );
    }


    if (
      selectedBranch !== "All"
    ) {
      const branch =
        branches.find(
          (b) =>
            b.branch_name ===
            selectedBranch
        );

      if (branch) {
        params.set(
          "branch_id",
          branch.branch_id
        );
      }
    }


    /*
     * The backend supports designation_id.
     *
     * Current attendance records expose
     * designation_name, so we find the
     * corresponding designation from the
     * currently loaded records.
     */

    if (
      selectedDesignation !==
      "All"
    ) {
      const record =
        items.find(
          (a) =>
            a.designation_name ===
            selectedDesignation
        );

      if (
        record &&
        record.designation_id
      ) {
        params.set(
          "designation_id",
          record.designation_id
        );
      }
    }


    return params;
  };


  // ==========================================================
  // EXPORT EXCEL
  // ==========================================================

  const handleExport = async () => {
    if (exporting) {
      return;
    }


    setExporting(true);
    setImportMessage(null);


    try {
      const token =
        localStorage.getItem(
          "bindu_token"
        );


      const params =
        buildReportQuery();


      const response =
        await fetch(
          `/api/attendance/export?${params.toString()}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      if (!response.ok) {
        let message =
          "Failed to export attendance.";

        try {
          const data =
            await response.json();

          message =
            data?.message ||
            message;
        } catch {
          // Ignore JSON parsing failure.
        }

        throw new Error(message);
      }


      const blob =
        await response.blob();


      const url =
        window.URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "attendance_report.xlsx";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );


      setImportMessage({
        type: "success",
        text:
          "Attendance Excel exported successfully.",
      });

    } catch (err) {
      setImportMessage({
        type: "error",
        text:
          err?.message ||
          "Failed to export attendance.",
      });
    } finally {
      setExporting(false);
    }
  };


  // ==========================================================
  // IMPORT EXCEL
  // ==========================================================

  const handleImportClick = () => {
    if (importing) {
      return;
    }

    fileInputRef.current?.click();
  };


  const handleImport = async (
    event
  ) => {
    const file =
      event.target.files?.[0];


    event.target.value = "";


    if (!file) {
      return;
    }


    const filename =
      file.name.toLowerCase();


    if (
      !filename.endsWith(".xlsx") &&
      !filename.endsWith(".xlsm")
    ) {
      setImportMessage({
        type: "error",
        text:
          "Please select an .xlsx or .xlsm Excel file.",
      });

      return;
    }


    setImporting(true);
    setImportMessage(null);


    try {
      const token =
        localStorage.getItem(
          "bindu_token"
        );


      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );


      const response =
        await fetch(
          "/api/attendance/import",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        let message =
          data?.message ||
          "Attendance import failed.";


        if (
          Array.isArray(
            data?.errors
          ) &&
          data.errors.length > 0
        ) {
          message +=
            ` First error: ${data.errors[0].message}`;
        }


        throw new Error(message);
      }


      setImportMessage({
        type: "success",
        text:
          `${data.message} Created: ${data.created}, Updated: ${data.updated}.`,
      });


      await load();

    } catch (err) {
      setImportMessage({
        type: "error",
        text:
          err?.message ||
          "Attendance import failed.",
      });
    } finally {
      setImporting(false);
    }
  };


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters = () => {
    setQuery("");
    setSelectedBranch("All");
    setSelectedDepartment("All");
    setSelectedDesignation("All");
    setSelectedStatus("All");
    setDateFrom("");
    setDateTo("");
  };


  const hasFilters =
    query.trim() ||
    selectedBranch !== "All" ||
    selectedDepartment !== "All" ||
    selectedDesignation !== "All" ||
    selectedStatus !== "All" ||
    dateFrom ||
    dateTo;


  // ==========================================================
  // LOADING / ERROR
  // ==========================================================

  if (loading) {
    return (
      <LoadingSpinner
        label="Loading attendance..."
      />
    );
  }


  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={load}
      />
    );
  }


  // ==========================================================
  // STATS
  // ==========================================================

  const STATS = [
    {
      label: "Present",
      value: counts.present,
      icon: UserCheck,
      accent:
        "from-emerald-400 to-teal-600",
    },

    {
      label: "Late",
      value: counts.late,
      icon: Clock,
      accent:
        "from-amber-400 to-orange-500",
    },

    {
      label: "Absent",
      value: counts.absent,
      icon: UserX,
      accent:
        "from-rose-400 to-pink-600",
    },

    {
      label: "On Leave",
      value: counts.leave,
      icon: CalendarOff,
      accent:
        "from-brand-400 to-brand-600",
    },
  ];


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* ======================================================
          STAT CARDS
      ======================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {STATS.map((s) => {
          const Icon = s.icon;

          return (
            <div
              key={s.label}
              className="glass-card p-5 flex items-center gap-4"
            >
              <div
                className={`
                  w-12 h-12 rounded-xl
                  bg-gradient-to-br
                  ${s.accent}
                  flex items-center
                  justify-center
                  shadow-md
                `}
              >
                <Icon
                  className="w-6 h-6 text-white"
                  strokeWidth={2.2}
                />
              </div>

              <div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {s.value}
                </p>

                <p className="text-sm text-slate-500">
                  {s.label}
                </p>
              </div>
            </div>
          );
        })}

      </div>


      {/* ======================================================
          MANAGEMENT REPORTING PANEL
      ======================================================= */}

      {isManagement && (
        <div className="glass-card p-4 space-y-4">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

            <div>
              <h3 className="text-base font-bold text-slate-800">
                Attendance Reports
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Filter attendance records and manage Excel reports.
              </p>
            </div>


            <div className="flex flex-wrap gap-2">

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xlsm"
                className="hidden"
                onChange={handleImport}
              />

              <button
                type="button"
                onClick={handleImportClick}
                disabled={importing}
                className="
                  inline-flex items-center
                  justify-center gap-2
                  h-10 px-4
                  rounded-lg
                  bg-white
                  border border-brand-200
                  text-brand-700
                  text-sm font-semibold
                  hover:bg-brand-50
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition
                "
              >
                <Upload className="w-4 h-4" />

                {importing
                  ? "Importing..."
                  : "Import Excel"}
              </button>


              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="
                  inline-flex items-center
                  justify-center gap-2
                  h-10 px-4
                  rounded-lg
                  bg-gradient-to-r
                  from-brand-400
                  to-brand-600
                  text-white
                  text-sm font-semibold
                  shadow-md
                  hover:opacity-95
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition
                "
              >
                <Download className="w-4 h-4" />

                {exporting
                  ? "Exporting..."
                  : "Export Excel"}
              </button>

            </div>

          </div>


          {/* Import / Export feedback */}

          {importMessage && (
            <div
              className={`
                flex items-start
                justify-between
                gap-3
                rounded-lg
                px-4 py-3
                text-sm
                border
                ${
                  importMessage.type ===
                  "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }
              `}
            >
              <span>
                {importMessage.text}
              </span>

              <button
                type="button"
                onClick={() =>
                  setImportMessage(null)
                }
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}


          {/* =================================================
              FILTERS
          ================================================== */}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Search */}

            <div className="relative">

              <Search
                className="
                  absolute left-3
                  top-1/2
                  -translate-y-1/2
                  w-4 h-4
                  text-slate-400
                "
              />

              <input
                type="text"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Search employee..."
                autoComplete="off"
                className="input h-11 pl-10 w-full"
              />

            </div>


            {/* Branch */}

            <BranchFilter
              branches={branches}
              value={selectedBranch}
              onChange={setSelectedBranch}
            />


            {/* Department */}

            <select
              className="input h-11"
              value={selectedDepartment}
              onChange={(e) =>
                setSelectedDepartment(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Departments
              </option>

              {departments.map(
                (department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                )
              )}

            </select>


            {/* Designation */}

            <select
              className="input h-11"
              value={selectedDesignation}
              onChange={(e) =>
                setSelectedDesignation(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Designations
              </option>

              {designations.map(
                (designation) => (
                  <option
                    key={designation}
                    value={designation}
                  >
                    {designation}
                  </option>
                )
              )}

            </select>


            {/* Date From */}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Date From
              </label>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) =>
                  setDateFrom(
                    e.target.value
                  )
                }
                className="input h-11 w-full"
              />
            </div>


            {/* Date To */}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Date To
              </label>

              <input
                type="date"
                value={dateTo}
                onChange={(e) =>
                  setDateTo(
                    e.target.value
                  )
                }
                className="input h-11 w-full"
              />
            </div>


            {/* Status */}

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Status
              </label>

              <select
                className="input h-11 w-full"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value
                  )
                }
              >
                <option value="All">
                  All Statuses
                </option>

                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}

              </select>
            </div>


            {/* Clear */}

            <div className="flex items-end">

              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasFilters}
                className="
                  w-full
                  h-11
                  rounded-lg
                  border border-slate-200
                  bg-white
                  text-slate-600
                  text-sm font-semibold
                  hover:bg-slate-50
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  transition
                "
              >
                Clear Filters
              </button>

            </div>

          </div>


          {/* Active filter summary */}

          <div className="flex flex-wrap items-center gap-2 text-xs">

            <span className="font-semibold text-slate-500">
              Showing:
            </span>

            <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">
              {visible.length} records
            </span>

            {selectedBranch !== "All" && (
              <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700">
                Branch: {selectedBranch}
              </span>
            )}

            {selectedDepartment !== "All" && (
              <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">
                Department: {selectedDepartment}
              </span>
            )}

            {selectedDesignation !== "All" && (
              <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                Designation: {selectedDesignation}
              </span>
            )}

            {selectedStatus !== "All" && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                Status: {selectedStatus}
              </span>
            )}

            {dateFrom && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                From: {dateFrom}
              </span>
            )}

            {dateTo && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                To: {dateTo}
              </span>
            )}

          </div>

        </div>
      )}


      {/* ======================================================
          TABS
      ======================================================= */}

      <div className="flex gap-1 p-1 bg-white/70 backdrop-blur-md border border-brand-100 rounded-xl w-fit">

        {[
          {
            id: "today",
            label: "Today",
          },
          {
            id: "all",
            label: "All Records",
          },
          {
            id: "trend",
            label: "Trend",
          },
        ].map((t) => (

          <button
            key={t.id}
            onClick={() =>
              setTab(t.id)
            }
            className={`
              px-4 py-2
              rounded-lg
              text-sm
              font-semibold
              transition
              ${
                tab === t.id
                  ? "bg-gradient-to-r from-brand-400 to-brand-600 text-white"
                  : "text-slate-600 hover:text-brand-600"
              }
            `}
          >
            {t.label}
          </button>

        ))}

      </div>


      {/* ======================================================
          TREND
      ======================================================= */}

      {tab === "trend" ? (

        <div className="glass-card p-5">

          <h3 className="text-base font-bold text-slate-800 mb-2">
            Attendance Across the Week
          </h3>

          <div className="h-80">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <AreaChart data={trend}>

                <defs>
                  <linearGradient
                    id="presentGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#0EA5E9"
                      stopOpacity={0.5}
                    />

                    <stop
                      offset="95%"
                      stopColor="#0EA5E9"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>


                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                />

                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "rgba(255,255,255,0.95)",
                    border:
                      "1px solid #BAE6FD",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#0EA5E9"
                  strokeWidth={3}
                  fill="url(#presentGrad)"
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

        </div>

      ) : visible.length === 0 ? (

        <EmptyState
          title="No attendance records"
          message={
            tab === "today"
              ? "No records logged today yet."
              : "No attendance matches the selected filters."
          }
        />

      ) : (

        /* ====================================================
           ATTENDANCE TABLE
        ===================================================== */

        <div className="glass-card overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-brand-50/60">

                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 font-bold">

                  {isManagement && (
                    <>
                      <th className="px-5 py-3">
                        Employee
                      </th>

                      <th className="px-5 py-3">
                        Branch
                      </th>
                    </>
                  )}

                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Check In
                  </th>

                  <th className="px-5 py-3">
                    Lunch Out
                  </th>

                  <th className="px-5 py-3">
                    Lunch In
                  </th>

                  <th className="px-5 py-3">
                    Check Out
                  </th>

                  <th className="px-5 py-3">
                    Lunch Duration
                  </th>

                  <th className="px-5 py-3">
                    Working Hours
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {visible.map(
                  (a, i) => {

                    const name =
                      a.employee_name ||
                      a.full_name ||
                      `Employee #${
                        a.employee_id ??
                        "—"
                      }`;


                    return (

                      <tr
                        key={
                          a.attendance_id ??
                          i
                        }
                        className="hover:bg-brand-50/40"
                      >

                        {isManagement && (
                          <>

                            <td className="px-5 py-3">

                              <div className="flex items-center gap-3">

                                <div
                                  className="
                                    w-9 h-9
                                    rounded-full
                                    bg-gradient-to-br
                                    from-brand-400
                                    to-brand-600
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                  "
                                >
                                  {initials(
                                    name
                                  )}
                                </div>

                                <div>

                                  <p className="font-semibold text-slate-800">
                                    {name}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {a.employee_code}
                                  </p>

                                </div>

                              </div>

                            </td>


                            <td className="px-5 py-3">

                              <span
                                className="
                                  inline-flex
                                  items-center
                                  rounded-full
                                  bg-sky-50
                                  px-3
                                  py-1
                                  text-xs
                                  font-semibold
                                  text-sky-700
                                "
                              >
                                📍{" "}
                                {a.branch_name ||
                                  "—"}
                              </span>

                            </td>

                          </>
                        )}


                        <td className="px-5 py-3 text-slate-700">
                          {formatDate(
                            a.attendance_date ??
                            a.date ??
                            a.created_at
                          )}
                        </td>


                        <td className="px-5 py-3 font-mono text-slate-700">
                          {formatTime(
                            a.check_in ??
                            a.login_time
                          )}
                        </td>


                        <td className="px-5 py-3 font-mono text-orange-600">
                          {a.lunch_start_time
                            ? formatTime(
                                a.lunch_start_time
                              )
                            : "—"}
                        </td>


                        <td className="px-5 py-3 font-mono text-emerald-600">
                          {a.lunch_end_time
                            ? formatTime(
                                a.lunch_end_time
                              )
                            : "—"}
                        </td>


                        <td className="px-5 py-3 font-mono text-slate-700">
                          {formatTime(
                            a.check_out ??
                            a.logout_time
                          )}
                        </td>


                        <td className="px-5 py-3 font-mono text-slate-700">
                          {formatDuration(
                            a.lunch_seconds
                          )}
                        </td>


                        <td className="px-5 py-3 font-mono text-slate-700">
                          {formatDuration(
                            a.working_seconds
                          )}
                        </td>


                        <td className="px-5 py-3">
                          <StatusBadge
                            status={
                              a.status ??
                              "—"
                            }
                          />
                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}


/*
 * Small safety wrapper so the page remains stable
 * even if AuthContext temporarily returns no user.
 *
 * This keeps the existing useAuth dependency
 * isolated without changing the application's
 * authentication architecture.
 */
function useAuthSafe() {
  const auth = useAuth();

  return {
    user: auth?.user ?? null,
  };
}