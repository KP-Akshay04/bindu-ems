import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  updateEmployee,
  changePassword,
} from "../services/api";

export default function Settings() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [changingPassword, setChangingPassword] =
    useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const updateField = (key) => (e) => {
    setForm({
      ...form,
      [key]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateEmployee(
        user.employee_id,
        form
      );

      const updatedUser = {
        ...user,
        ...form,
      };

      localStorage.setItem(
        "bindu_user",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);

      alert("Profile updated successfully");
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (
        passwords.new_password !==
        passwords.confirm_password
      ) {
        alert("New passwords do not match");
        return;
      }

      if (
        passwords.new_password.length < 6
      ) {
        alert(
          "Password must be at least 6 characters"
        );
        return;
      }

      setChangingPassword(true);

      await changePassword(
        user.employee_id,
        {
          current_password:
            passwords.current_password,
          new_password:
            passwords.new_password,
        }
      );

      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      alert(
        "Password changed successfully"
      );
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Password update failed"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-5">
          Profile Settings
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Full Name
            </label>

            <input
              className="input"
              value={form.full_name}
              onChange={updateField("full_name")}
            />
          </div>

          <div>
            <label className="label">
              Email
            </label>

            <input
              className="input"
              type="email"
              value={form.email}
              onChange={updateField("email")}
            />
          </div>

          <div>
            <label className="label">
              Phone
            </label>

            <input
              className="input"
              value={form.phone}
              onChange={updateField("phone")}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-5">
          Security
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="input"
            type="password"
            placeholder="Current Password"
            value={
              passwords.current_password
            }
            onChange={(e) =>
              setPasswords({
                ...passwords,
                current_password:
                  e.target.value,
              })
            }
          />

          <input
            className="input"
            type="password"
            placeholder="New Password"
            value={passwords.new_password}
            onChange={(e) =>
              setPasswords({
                ...passwords,
                new_password:
                  e.target.value,
              })
            }
          />

          <input
            className="input"
            type="password"
            placeholder="Confirm Password"
            value={
              passwords.confirm_password
            }
            onChange={(e) =>
              setPasswords({
                ...passwords,
                confirm_password:
                  e.target.value,
              })
            }
          />
        </div>

        <div className="mt-6">
          <button
            onClick={handlePasswordChange}
            disabled={changingPassword}
            className="btn-primary"
          >
            {changingPassword
              ? "Updating..."
              : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}