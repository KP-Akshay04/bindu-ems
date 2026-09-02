import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="glass-card p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <p className="text-slate-800 font-semibold mb-1">Unable to load data</p>
      <p className="text-sm text-slate-500 mb-5">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      )}
    </div>
  );
}