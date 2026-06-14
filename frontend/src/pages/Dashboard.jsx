import {
  Users,
  CalendarCheck,
  Clock3,
  IndianRupee,
} from "lucide-react";

export default function Dashboard() {
  const cards = [
    {
      title: "Total Employees",
      value: "120",
      icon: Users,
    },
    {
      title: "Present Today",
      value: "108",
      icon: CalendarCheck,
    },
    {
      title: "Pending Leaves",
      value: "14",
      icon: Clock3,
    },
    {
      title: "Monthly Payroll",
      value: "₹12.5L",
      icon: IndianRupee,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-5">
        <h1 className="text-3xl font-bold text-slate-800">
          BINDU EMS Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Employee Management System Overview
        </p>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="bg-white rounded-2xl shadow-md p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">
                      {card.title}
                    </p>

                    <h2 className="text-3xl font-bold mt-2">
                      {card.value}
                    </h2>
                  </div>

                  <Icon
                    size={36}
                    className="text-blue-600"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Placeholder Sections */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-2xl shadow-md p-6 h-80">
            <h3 className="text-xl font-semibold mb-4">
              Attendance Overview
            </h3>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 h-80">
            <h3 className="text-xl font-semibold mb-4">
              Department Statistics
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}