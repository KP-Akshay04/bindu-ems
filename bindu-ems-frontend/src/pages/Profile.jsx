import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!photo) {
      alert("Please select a photo");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("photo", photo);

      await api.post(
        `/api/employees/${user.employee_id}/photo`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      await refreshUser();
      alert("Profile photo uploaded successfully");
      setPhoto(null);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div className="glass-card p-8 text-center">
        <div className="w-28 h-28 mx-auto">
  {user?.employee_photo ? (
    <img
      src={`${window.location.origin}/${user.employee_photo.replace(/\\/g, "/")}`}
      alt="Profile"
      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
    />
  ) : (
    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-3xl font-bold">
      {initials}
    </div>
  )}
</div>

        <h2 className="mt-4 text-2xl font-bold text-slate-800">
          {user?.full_name || "Unknown User"}
        </h2>
        <p className="text-brand-600 font-semibold">{user?.role || "Employee"}</p>

        <div className="mt-5 flex flex-col items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Employee Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Info label="Employee Code" value={user?.employee_code} />
          <Info label="Email" value={user?.email} />
          <Info label="Phone" value={user?.phone} />
          <Info label="Role" value={user?.role} />
          <Info label="Designation" value={user?.designation} />
          <Info label="Department" value={user?.department} />
          <Info label="Status" value={user?.status} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value || "—"}</p>
    </div>
  );
}