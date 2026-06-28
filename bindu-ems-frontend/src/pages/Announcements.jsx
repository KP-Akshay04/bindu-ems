import { useEffect, useState } from "react";
import { Plus, Search, Trash2, } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement, } from "../services/api";
import AnnouncementFormDialog from "../components/AnnouncementFormDialog";

export default function Announcements() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const canCreate =
    user?.role === "Super Admin" ||
    user?.role === "HR";

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

  const handleDelete = async (id) => {

  if (
    !window.confirm(
      "Delete this announcement?"
    )
  )
    return;

  try {

    await deleteAnnouncement(id);

    await load();

  } catch (err) {

    alert(
      err?.response?.data?.message ||
      err.message
    );

  }

};

  const filtered = items.filter((a) => {

  const q = query.toLowerCase();

  return (
    !q ||
    String(a.title ?? "")
      .toLowerCase()
      .includes(q) ||
    String(a.message ?? "")
      .toLowerCase()
      .includes(q)
  );

});


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

<div className="glass-card p-4">

  <div className="relative">

    <Search
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
    />

    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search announcements..."
      className="input h-11 pl-10"
    />

  </div>

</div>

      {filtered.map((a) => (
        <div
          key={a.announcement_id}
          className="glass-card p-5"
        >
          <div className="flex items-start justify-between">

  <h3 className="font-bold text-lg">
    {a.title}
  </h3>

  {canCreate && (
    <button
      onClick={() =>
        handleDelete(a.announcement_id)
      }
      className="text-red-600 hover:text-red-700"
      title="Delete Announcement"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )}

</div>

          <p className="mt-2 text-slate-600">
            {a.message}
          </p>

          <p className="mt-3 text-xs text-slate-400">

  {new Date(a.created_at).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )}

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