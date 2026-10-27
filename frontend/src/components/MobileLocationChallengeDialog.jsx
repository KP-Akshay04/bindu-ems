import { QrCode, Smartphone, X } from "lucide-react";


export default function MobileLocationChallengeDialog({
  challenge,
  status,
  error,
  onCancel,
}) {
  if (!challenge) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <section className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button
          className="btn-ghost absolute right-4 top-4"
          type="button"
          aria-label="Cancel phone verification"
          onClick={onCancel}
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex items-center gap-3 pr-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Smartphone size={23} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Verify with your phone
            </h2>
            <p className="text-sm text-slate-500">
              This code expires in two minutes.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5 text-center">
          {status === "pending" ? (
            <img
              className="mx-auto h-56 w-56 rounded-xl bg-white p-2"
              src={challenge.qr_url}
              alt="Scan this QR code using the BINDU EMS site on your phone"
            />
          ) : (
            <div className="flex h-56 flex-col items-center justify-center gap-3 text-brand-700">
              <QrCode size={46} />
              <p className="font-semibold">
                {status === "approved"
                  ? "Phone approved. Signing you in..."
                  : "Waiting for phone verification..."}
              </p>
            </div>
          )}
        </div>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Open your phone camera and scan the QR code.</li>
          <li>Enter the same Employee ID and password.</li>
          <li>Allow precise location access on the phone.</li>
        </ol>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          className="btn-secondary mt-5 w-full"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </section>
    </div>
  );
}
