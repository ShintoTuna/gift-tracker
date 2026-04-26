// Display-side formatters for occasions and dates. Server returns
// raw timestamps + occasion types; this module turns those into the
// strings that show up on rows and chips.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const TYPE_NAMES: Record<string, string> = {
  birthday: "Birthday",
  christmas: "Christmas",
  anniversary: "Anniversary",
  mothers_day: "Mother's Day",
};

export function occasionTypeName(
  type: string,
  customLabel?: string,
): string {
  if (type === "custom") return customLabel ?? "Event";
  return TYPE_NAMES[type] ?? type;
}

// "Birthday · in 5 days" / "Birthday · today" / "Birthday · May 15".
// Switches to absolute dates beyond a 14-day horizon — that's the
// distance at which "in N days" stops feeling immediate.
export function formatDateLine(opts: {
  occasionType: string;
  customLabel?: string;
  nextDate: number;
  now?: number;
}): string {
  const now = opts.now ?? Date.now();
  const days = Math.ceil((opts.nextDate - now) / ONE_DAY_MS);
  const occName = occasionTypeName(opts.occasionType, opts.customLabel);
  if (days <= 0) return `${occName} · today`;
  if (days === 1) return `${occName} · tomorrow`;
  if (days <= 14) return `${occName} · in ${days} days`;
  const date = new Date(opts.nextDate);
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${occName} · ${month} ${date.getUTCDate()}`;
}
