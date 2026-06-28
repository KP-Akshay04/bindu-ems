import React from "react";

export default function PayslipDialog({
  open,
  onClose,
  payroll,
}) {
  if (!open || !payroll) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">

        {/* Header */}

        <div className="border-b px-8 py-6">

          <div className="flex items-center gap-5">

            <div className="w-16 h-16 rounded-xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold">
              B
            </div>

            <div>

              <h2 className="text-3xl font-bold">
                BINDU EMS
              </h2>

              <p className="text-slate-500">
                Employee Management System
              </p>

              <p className="text-sm mt-1">

                Payslip for{" "}

                {new Date(
                  payroll.pay_date ??
                    payroll.created_at
                ).toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}

              </p>

            </div>

          </div>

        </div>

                <div className="grid md:grid-cols-2 gap-10 px-8 py-6 border-b">

          <table className="w-full text-sm">

            <tbody>

              <Row
                label="Employee ID"
                value={payroll.employee_id}
              />

              <Row
                label="Employee Name"
                value={
                  payroll.employee_name ??
                  payroll.full_name
                }
              />

              <Row
                label="Designation"
                value={payroll.designation}
              />

              <Row
                label="Department"
                value={payroll.department}
              />

              <Row
                label="Joining Date"
                value={payroll.joining_date}
              />

            </tbody>

          </table>

          <table className="w-full text-sm">

            <tbody>

              <Row
                label="Bank"
                value={payroll.bank ?? "—"}
              />

              <Row
                label="Account No."
                value={
                  payroll.account_no ?? "—"
                }
              />

              <Row
                label="PF No."
                value={payroll.pf_no ?? "—"}
              />

              <Row
                label="ESI No."
                value={payroll.esi_no ?? "—"}
              />

              <Row
                label="UAN"
                value={payroll.uan ?? "—"}
              />

            </tbody>

          </table>

        </div>

        <div className="px-8 py-5 border-b">

  <table className="w-full border border-slate-300 text-sm">

    <tbody>

      <tr>

        <td className="border p-2 font-medium">
          Gross Wages
        </td>

        <td className="border p-2">
          ₹{Number(payroll.net_salary ?? payroll._net ?? 0).toLocaleString()}
        </td>

        <td className="border p-2 font-medium">
          Total Working Days
        </td>

        <td className="border p-2">
          30
        </td>

      </tr>

      <tr>

        <td className="border p-2 font-medium">
          Paid Days
        </td>

        <td className="border p-2">
          30
        </td>

        <td className="border p-2 font-medium">
          Leave Days
        </td>

        <td className="border p-2">
          0
        </td>

      </tr>

    </tbody>

  </table>

</div>

<div className="px-8 py-6">

  <table className="w-full border border-slate-300 text-sm">

    <thead>

      <tr className="bg-slate-100">

        <th className="border p-2">
          Earnings
        </th>

        <th className="border p-2">
          Amount
        </th>

        <th className="border p-2">
          Deductions
        </th>

        <th className="border p-2">
          Amount
        </th>

      </tr>

    </thead>

    <tbody>

      <tr>

        <td className="border p-2">
          Basic Salary
        </td>

        <td className="border p-2">
          ₹{Number(payroll._basic ?? payroll.basic_salary ?? 0).toLocaleString()}
        </td>

        <td className="border p-2">
          PF
        </td>

        <td className="border p-2">
          ₹0
        </td>

      </tr>

      <tr>

        <td className="border p-2">
          HRA
        </td>

        <td className="border p-2">
          ₹{Number(payroll._hra ?? 0).toLocaleString()}
        </td>

        <td className="border p-2">
          ESI
        </td>

        <td className="border p-2">
          ₹0
        </td>

      </tr>

      <tr>

        <td className="border p-2">
          Allowances
        </td>

        <td className="border p-2">
          ₹{Number(payroll._allowances ?? 0).toLocaleString()}
        </td>

        <td className="border p-2">
          Other Deductions
        </td>

        <td className="border p-2">
          ₹{Number(payroll._deductions ?? 0).toLocaleString()}
        </td>

      </tr>

      <tr className="font-bold bg-slate-50">

        <td className="border p-2">
          Total Earnings
        </td>

        <td className="border p-2">
          ₹{Number(payroll._net ?? payroll.net_salary ?? 0).toLocaleString()}
        </td>

        <td className="border p-2">
          Total Deductions
        </td>

        <td className="border p-2">
          ₹{Number(payroll._deductions ?? 0).toLocaleString()}
        </td>

      </tr>

      <tr className="font-bold text-lg">

        <td
          className="border p-3 text-right"
          colSpan={3}
        >
          Net Salary
        </td>

        <td className="border p-3 text-green-700">

          ₹{Number(payroll._net ?? payroll.net_salary ?? 0).toLocaleString()}

        </td>

      </tr>

    </tbody>

  </table>

</div>

<div className="flex justify-end gap-3 px-8 pb-8">

  <button
    onClick={() => window.print()}
    className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold"
  >
    Print
  </button>

  <button
    onClick={onClose}
    className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold"
  >
    Close
  </button>

</div>

      </div>

    </div>

  );
}

function Row({ label, value }) {

  return (

    <tr>

      <td className="py-2 font-medium w-44">
        {label}
      </td>

      <td className="py-2">
        :
      </td>

      <td className="py-2">
        {value || "—"}
      </td>

    </tr>

  );

}