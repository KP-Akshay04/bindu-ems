import React from "react";
import PayslipTemplate from "./PayslipTemplate";
import { downloadPayslip } from "../utils/pdfUtils";

export default function PayslipDialog({
  open,
  onClose,
  payroll,
}) {
  if (!open || !payroll) return null;

  const handlePrint = () => {
    const content = document.getElementById("payslip-content");

    if (!content) return;

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip</title>

          <style>
            body{
              margin:20px;
              font-family:Arial,Helvetica,sans-serif;
              background:white;
            }

            table{
              width:100%;
              border-collapse:collapse;
            }

            th,td{
              border:1px solid #ccc;
              padding:8px;
            }
          </style>

        </head>

        <body>

          ${content.outerHTML}

        </body>

      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col">

        {/* Header */}

        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">

          <div>

            <h2 className="text-2xl font-bold text-brand-700">
              Payroll Payslip
            </h2>

            <p className="text-sm text-slate-500">
              Employee Salary Statement
            </p>

          </div>

          <button
            onClick={onClose}
            className="text-3xl text-slate-500 hover:text-red-600"
          >
            ×
          </button>

        </div>

        {/* Scrollable Body */}

        <div className="flex-1 overflow-y-auto p-6">

          <PayslipTemplate payroll={payroll} />

        </div>

        {/* Sticky Footer */}

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">

          <button
            onClick={() =>
              downloadPayslip(
                `Bindu_Payslip_${
                  payroll.employee_code ??
                  payroll.employee_id
                }.pdf`
              )
            }
            className="px-5 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-semibold"
          >
            Download PDF
          </button>

          <button
            onClick={handlePrint}
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