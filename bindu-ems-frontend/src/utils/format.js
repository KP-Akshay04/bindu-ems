export const formatINR = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (input) => {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const formatTime = (input) => {
  if (!input) return "—";
  // accepts "HH:MM:SS", ISO datetime, or "HH:MM"
  if (typeof input === "string" && /^\d{1,2}:\d{2}/.test(input)) {
    const [h, m] = input.split(":");
    const date = new Date();
    date.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/**
 * Defensive array extractor for Flask responses that may return:
 *   - a plain array
 *   - { data: [...] }
 *   - { employees: [...] } / { attendance: [...] } / { leaves: [...] } / { payroll: [...] }
 *   - { results: [...] }
 */
export const extractList = (res, ...keys) => {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];
  for (const k of keys) {
    if (Array.isArray(res[k])) return res[k];
  }
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.results)) return res.results;
  return [];
};