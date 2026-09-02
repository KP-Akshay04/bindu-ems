import { Inbox } from "lucide-react";

export default function EmptyState({ title = "No data yet", message = "Records will appear here once available.", icon: Icon = Inbox }) {
  return (
    <div className="glass-card p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-slate-800 font-semibold mb-1">{title}</p>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}