const TONES = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-brand-100 text-brand-700",
  slate: "bg-slate-200 text-slate-600",
  indigo: "bg-indigo-100 text-indigo-700",
};

const MAP = {
  // attendance
  present: "emerald",
  "checked-in": "emerald",
  late: "amber",
  absent: "rose",
  working: "indigo",
  // employee
  active: "emerald",
  inactive: "slate",
  deactivated: "slate",
  "on leave": "sky",
  // leaves / payroll
  approved: "emerald",
  paid: "emerald",
  pending: "amber",
  processing: "amber",
  rejected: "rose",
  "on hold": "rose",
};

export default function StatusBadge({ status }) {
  const label = String(status ?? "—");
  const key = label.toLowerCase();
  const tone = MAP[key] || "slate";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${TONES[tone]}`}>
      {label}
    </span>
  );
}