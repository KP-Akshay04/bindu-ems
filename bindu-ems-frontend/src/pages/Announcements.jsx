import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Megaphone,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../services/api";

import AnnouncementFormDialog from "../components/AnnouncementFormDialog";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";

export default function Announcements() {

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState([]);

  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);

  const canCreate =
    user?.role === "Super Admin";

  const load = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await fetchAnnouncements();

      setItems(
        Array.isArray(data)
          ? data
          : data.announcements ?? []
      );

    } catch (err) {

      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to load announcements."
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    load();

  }, []);

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
        "Announcement published successfully."
      );

    } catch (err) {

      alert(

        err?.response?.data?.message ||

        err.message ||

        "Failed to publish announcement."

      );

    } finally {

      setSaving(false);

    }

  };

  const handleDelete = async (
    announcementId
  ) => {

    if (
      !window.confirm(
        "Delete this announcement?"
      )
    ) {
      return;
    }

    try {

      await deleteAnnouncement(
        announcementId
      );

      await load();

    } catch (err) {

      alert(

        err?.response?.data?.message ||

        err.message ||

        "Failed to delete announcement."

      );

    }

  };

  const filtered = useMemo(() => {

    const search =
      query
        .trim()
        .toLowerCase();

    return items.filter((a) => {

      return (

        !search ||

        String(a.title ?? "")
          .toLowerCase()
          .includes(search) ||

        String(a.message ?? "")
          .toLowerCase()
          .includes(search)

      );

    });

  }, [
    items,
    query,
  ]);

  if (loading) {

    return (
      <LoadingSpinner
        label="Loading Announcements..."
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

  return (

    <div className="space-y-5">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">

            Announcements

          </h1>

          <p className="text-sm text-slate-500">

            Company-wide announcements.

          </p>

        </div>

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

      {/* Search */}

      <div className="glass-card p-4">

        <div className="relative">

          <Search
            className="absolute
                       left-3
                       top-1/2
                       -translate-y-1/2
                       w-4
                       h-4
                       text-slate-400"
          />

          <input
            type="text"
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Search announcements..."
            className="input h-11 pl-10"
          />

        </div>

      </div>

            {/* Announcements */}

      {filtered.length === 0 ? (

        <EmptyState
          title="No Announcements"
          message="No announcements have been published yet."
        />

      ) : (

        <div className="space-y-4">

          {filtered.map((a) => (

            <div
              key={a.announcement_id}
              className="glass-card p-6 hover:shadow-lg transition-all duration-300"
            >

              <div className="flex justify-between items-start gap-4">

                <div className="flex gap-4 flex-1">

                  <div
                    className="
                      w-12
                      h-12
                      rounded-xl
                      bg-gradient-to-br
                      from-brand-500
                      to-sky-600
                      text-white
                      flex
                      items-center
                      justify-center
                      shadow"
                  >

                    <Megaphone className="w-6 h-6" />

                  </div>

                  <div className="flex-1">

                    <h3 className="text-lg font-semibold text-slate-800">

                      {a.title}

                    </h3>

                    <p className="mt-2 text-slate-600 leading-7 whitespace-pre-wrap">

                      {a.message}

                    </p>

                    <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-400">

                      <span>

                        Published :

                        {" "}

                        {a.created_at
                          ? new Date(
                              a.created_at
                            ).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "—"}

                      </span>

                    </div>

                  </div>

                </div>

                {canCreate && (

                  <button
                    onClick={() =>
                      handleDelete(
                        a.announcement_id
                      )
                    }
                    title="Delete Announcement"
                    className="
                      p-2
                      rounded-lg
                      text-red-600
                      hover:bg-red-50
                      transition
                    "
                  >

                    <Trash2 className="w-5 h-5" />

                  </button>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

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