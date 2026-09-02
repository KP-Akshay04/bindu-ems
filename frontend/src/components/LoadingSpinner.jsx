import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading data..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-3" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}