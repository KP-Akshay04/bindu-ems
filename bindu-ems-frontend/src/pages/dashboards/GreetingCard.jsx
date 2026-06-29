export default function GreetingCard({ user }) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Morning"
      : hour < 17
      ? "Afternoon"
      : "Evening";

  return (
    <div className="glass-card p-6">
      <h1 className="text-3xl font-bold text-slate-800">
        Good {greeting}
        {user?.full_name
          ? `, ${user.full_name.split(" ")[0]}`
          : ""}
      </h1>

      <p className="text-slate-500 mt-2">
        {new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}