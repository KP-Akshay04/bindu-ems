import {
  FaTachometerAlt,
  FaUsers,
  FaClipboardList,
  FaMoneyBill,
  FaCalendarCheck
} from "react-icons/fa";

import { MdWaterDrop } from "react-icons/md";

export default function Sidebar() {
  return (
    <div className="sidebar">

      <div className="logo">

        <MdWaterDrop size={40} />

        <h2>BINDU WATER</h2>

      </div>

      <ul>

        <li>
          <FaTachometerAlt />
          Dashboard
        </li>

        <li>
          <FaUsers />
          Employees
        </li>

        <li>
          <FaCalendarCheck />
          Attendance
        </li>

        <li>
          <FaClipboardList />
          Leaves
        </li>

        <li>
          <FaMoneyBill />
          Payroll
        </li>

      </ul>

    </div>
  );
}