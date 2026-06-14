import Modal from "./Modal";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger = false, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={
              danger
                ? "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-60"
                : "btn-primary"
            }
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </>
      }
    />
  );
}