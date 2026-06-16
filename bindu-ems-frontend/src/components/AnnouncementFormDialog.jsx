import { useState } from "react";
import Modal from "./Modal";

export default function AnnouncementFormDialog({
  open,
  onClose,
  onSubmit,
  loading,
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      title,
      message,
    });

    setTitle("");
    setMessage("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Announcement"
      description="Publish a new company announcement."
      size="lg"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="label">
            Title
          </label>

          <input
            className="input"
            required
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />
        </div>

        <div>
          <label className="label">
            Message
          </label>

          <textarea
            className="input min-h-[120px]"
            required
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading
              ? "Publishing..."
              : "Publish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}