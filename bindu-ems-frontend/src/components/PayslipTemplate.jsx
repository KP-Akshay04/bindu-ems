import React from "react";

const money = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

export default function PayslipTemplate({ payroll }) {
  if (!payroll) return null;

  const basic = Number(payroll._basic ?? payroll.basic_salary ?? 0);
  const hra = Number(payroll._hra ?? 0);
  const allowance = Number(payroll._allowances ?? 0);
  const deduction = Number(payroll._deductions ?? 0);
  const net = Number(payroll._net ?? payroll.net_salary ?? 0);

  return (
    <div
      id="payslip-content"
      className="bg-white text-slate-900 w-full p-8"
    >

          <div className="border-b-2 border-slate-300 pb-6">

        <div className="flex justify-between items-start">

          <div>

            <h1 className="text-3xl font-bold text-brand-700">
              BINDU WATER SUPPLY
            </h1>

            <p className="text-slate-500">
              Employee Management System
            </p>

            <p className="text-sm mt-2">
              Mangalore, Karnataka
            </p>

          </div>

          <div className="text-right">

            <h2 className="text-2xl font-bold">
              PAYSLIP
            </h2>

            <p className="text-sm text-slate-500">
              {new Date(
                payroll.pay_date ??
                  payroll.created_at
              ).toLocaleDateString(
                "en-IN",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>

            <p className="mt-2 text-sm">

              Payslip No :

              {" "}

              PS-
              {payroll.payroll_id}

            </p>

          </div>

        </div>

      </div>

            <div className="grid grid-cols-2 gap-10 py-8">

        <Info
          label="Employee Name"
          value={
            payroll.employee_name ??
            payroll.full_name
          }
        />

        <Info
          label="Employee ID"
          value={payroll.employee_id}
        />

        <Info
          label="Employee Code"
          value={payroll.employee_code}
        />

        <Info
          label="Department"
          value={payroll.department}
        />

        <Info
          label="Designation"
          value={payroll.designation}
        />

        <Info
          label="Joining Date"
          value={payroll.joining_date}
        />

      </div>

            <table className="w-full border border-slate-300 text-sm">

        <tbody>

          <Row
            left="Gross Salary"
            leftValue={money(net)}
            right="Working Days"
            rightValue="30"
          />

          <Row
            left="Paid Days"
            leftValue="30"
            right="Leave Days"
            rightValue="0"
          />

        </tbody>

      </table>

      <div className="mt-8">

  <table className="w-full border border-slate-300 text-sm">

    <thead>

      <tr className="bg-slate-100">

        <th className="border p-3 text-left">
          Earnings
        </th>

        <th className="border p-3 text-right">
          Amount
        </th>

        <th className="border p-3 text-left">
          Deductions
        </th>

        <th className="border p-3 text-right">
          Amount
        </th>

      </tr>

    </thead>

    <tbody>

      <SalaryRow
        earning="Basic Salary"
        earningValue={money(basic)}
        deduction="PF"
        deductionValue={money(0)}
      />

      <SalaryRow
        earning="HRA"
        earningValue={money(hra)}
        deduction="ESI"
        deductionValue={money(0)}
      />

      <SalaryRow
        earning="Allowances"
        earningValue={money(allowance)}
        deduction="Professional Tax"
        deductionValue={money(0)}
      />

      <SalaryRow
        earning="Other Earnings"
        earningValue={money(0)}
        deduction="Other Deductions"
        deductionValue={money(deduction)}
      />

      <tr className="font-bold bg-slate-50">

        <td className="border p-3">
          Total Earnings
        </td>

        <td className="border p-3 text-right">
          {money(net)}
        </td>

        <td className="border p-3">
          Total Deductions
        </td>

        <td className="border p-3 text-right">
          {money(deduction)}
        </td>

      </tr>

    </tbody>

  </table>

</div>


<div className="mt-8 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6">

  <div className="flex justify-between items-center">

    <div>

      <p className="text-slate-600">

        Net Salary

      </p>

      <h2 className="text-4xl font-bold text-emerald-700">

        {money(net)}

      </h2>

    </div>

    <div className="text-right">

      <p className="text-sm text-slate-500">

        Amount in Words

      </p>

      <p className="font-semibold">

        Rupees __________________ Only

      </p>

    </div>

  </div>

</div>

<div className="mt-14 flex justify-between items-end">

  <div>

    <p className="text-xs text-slate-500">

      This is a computer-generated payslip.

    </p>

    <p className="text-xs text-slate-500">

      No signature is required.

    </p>

  </div>

  <div className="text-center">

    <div className="border-t border-slate-500 w-52 mb-2"></div>

    <p className="font-semibold">

      Authorized Signature

    </p>

    <p className="text-sm text-slate-500">

      Human Resources

    </p>

  </div>

</div>

    </div>
  );
}

function Info({ label, value }) {

  return (

    <div>

      <p className="text-xs uppercase text-slate-500">

        {label}

      </p>

      <p className="font-semibold mt-1">

        {value || "—"}

      </p>

    </div>

  );

}

function Row({

  left,
  leftValue,
  right,
  rightValue,

}) {

  return (

    <tr>

      <td className="border p-3 font-medium">

        {left}

      </td>

      <td className="border p-3 text-right">

        {leftValue}

      </td>

      <td className="border p-3 font-medium">

        {right}

      </td>

      <td className="border p-3 text-right">

        {rightValue}

      </td>

    </tr>

  );

}

function SalaryRow({

  earning,
  earningValue,
  deduction,
  deductionValue,

}) {

  return (

    <tr>

      <td className="border p-3">

        {earning}

      </td>

      <td className="border p-3 text-right">

        {earningValue}

      </td>

      <td className="border p-3">

        {deduction}

      </td>

      <td className="border p-3 text-right">

        {deductionValue}

      </td>

    </tr>

  );

}