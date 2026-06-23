import { useEffect, useState } from "react";
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} from "../services/shiftService";

export default function Shifts() {
  const [shifts, setShifts] = useState([]);

  const [form, setForm] = useState({
    shift_name: "",
    start_time: "",
    end_time: "",
    grace_minutes: 15,
  });

  const [editingId, setEditingId] = useState(null);

  const loadShifts = async () => {
    try {
      const res = await getShifts();
      setShifts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateShift(editingId, form);
      } else {
        await createShift(form);
      }

      setForm({
        shift_name: "",
        start_time: "",
        end_time: "",
        grace_minutes: 15,
      });

      setEditingId(null);

      loadShifts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (shift) => {
    setEditingId(shift.shift_id);

    setForm({
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      grace_minutes: shift.grace_minutes,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shift?")) return;

    try {
      await deleteShift(id);
      loadShifts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold mb-4">
          Shift Management
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-4 gap-4"
        >
          <input
            type="text"
            placeholder="Shift Name"
            value={form.shift_name}
            onChange={(e) =>
              setForm({
                ...form,
                shift_name: e.target.value,
              })
            }
            className="input"
            required
          />

          <input
            type="time"
            value={form.start_time}
            onChange={(e) =>
              setForm({
                ...form,
                start_time: e.target.value,
              })
            }
            className="input"
            required
          />

          <input
            type="time"
            value={form.end_time}
            onChange={(e) =>
              setForm({
                ...form,
                end_time: e.target.value,
              })
            }
            className="input"
            required
          />

          <input
            type="number"
            placeholder="Grace Minutes"
            value={form.grace_minutes}
            onChange={(e) =>
              setForm({
                ...form,
                grace_minutes: e.target.value,
              })
            }
            className="input"
          />

          <button
            type="submit"
            className="btn-primary md:col-span-4"
          >
            {editingId
              ? "Update Shift"
              : "Create Shift"}
          </button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">
                Shift
              </th>

              <th className="text-left p-3">
                Start
              </th>

              <th className="text-left p-3">
                End
              </th>

              <th className="text-left p-3">
                Grace
              </th>

              <th className="text-left p-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {shifts.map((shift) => (
              <tr
                key={shift.shift_id}
                className="border-b"
              >
                <td className="p-3">
                  {shift.shift_name}
                </td>

                <td className="p-3">
                  {shift.start_time}
                </td>

                <td className="p-3">
                  {shift.end_time}
                </td>

                <td className="p-3">
                  {shift.grace_minutes} min
                </td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() =>
                      handleEdit(shift)
                    }
                    className="btn-secondary"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        shift.shift_id
                      )
                    }
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}