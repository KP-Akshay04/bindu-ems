import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchAnnouncements,
  createAnnouncement,
} from "../services/api";
import AnnouncementFormDialog from "../components/AnnouncementFormDialog";

export default function Announcements() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const canCreate =
    user?.role === "Super Admin" ||
    user?.role === "HR Admin";

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data =
      await fetchAnnouncements();

    setItems(data);
  };

  const handleCreate = async (
    payload
  ) => {
    try {
      setSaving(true);

      await createAnnouncement({
        ...payload,
        created_by:
          user.employee_id,
      });

      setOpen(false);

      await load();

      alert(
        "Announcement published successfully"
      );
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to publish"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Announcements
        </h1>

        {canCreate && (
          <button
            onClick={() =>
              setOpen(true)
            }
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Announcement
          </button>
        )}
      </div>

      {items.map((a) => (
        <div
          key={a.announcement_id}
          className="glass-card p-5"
        >
          <h3 className="font-bold text-lg">
            {a.title}
          </h3>

          <p className="mt-2 text-slate-600">
            {a.message}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {new Date(
              a.created_at
            ).toLocaleString()}
          </p>
        </div>
      ))}

      <AnnouncementFormDialog
        open={open}
        onClose={() =>
          setOpen(false)
        }
        onSubmit={handleCreate}
        loading={saving}
      />
    </div>
  );
}