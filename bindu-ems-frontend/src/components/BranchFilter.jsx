export default function BranchFilter({
  branches = [],
  value,
  onChange,
  className = "",
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input h-11 ${className}`}
    >
      <option value="All">
        🌍 All Branches
      </option>

      {branches
        .slice()
        .sort((a, b) =>
          a.branch_name.localeCompare(b.branch_name)
        )
        .map((branch) => (
          <option
            key={branch.branch_id}
            value={branch.branch_name}
          >
            📍 {branch.branch_name}
          </option>
        ))}
    </select>
  );
}