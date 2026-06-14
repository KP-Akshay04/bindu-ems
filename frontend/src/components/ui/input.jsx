export function Input({
  className = "",
  ...props
}) {
  return (
    <input
      className={`w-full border border-slate-200 bg-white outline-none ${className}`}
      {...props}
    />
  );
}