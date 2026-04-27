// Display-side formatters for occasions, dates, and prices. Server
// returns raw timestamps + occasion titles + numeric amounts; this
// module turns those into the strings that show up on rows, chips,
// and cards.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// "Birthday · in 5 days" / "Birthday · today" / "Birthday · May 15".
// Switches to absolute dates beyond a 14-day horizon — that's the
// distance at which "in N days" stops feeling immediate.
export function formatDateLine(opts: {
  title: string;
  nextDate: number;
  now?: number;
}): string {
  const now = opts.now ?? Date.now();
  const days = Math.ceil((opts.nextDate - now) / ONE_DAY_MS);
  if (days <= 0) return `${opts.title} · today`;
  if (days === 1) return `${opts.title} · tomorrow`;
  if (days <= 14) return `${opts.title} · in ${days} days`;
  const date = new Date(opts.nextDate);
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${opts.title} · ${month} ${date.getUTCDate()}`;
}

// "Annual · May 15" / "Once · Jun 12" / "Date TBD". For the
// Occasions section on the Profile screen.
export function formatOccasionLine(opts: {
  recurrence?: "yearly" | "one_off";
  date?: number;
}): string {
  if (opts.date == null) return "Date TBD";
  const date = new Date(opts.date);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getUTCDate();
  const recurrence = opts.recurrence ?? "one_off";
  const prefix = recurrence === "yearly" ? "Annual" : "Once";
  return `${prefix} · ${month} ${day}`;
}

// "today" / "tomorrow" / "in 5 days" / "in 3 weeks" / "in 4 months".
// No occasion-title prefix — the caller already shows the title
// alongside, so this is just the relative countdown.
export function formatRelativeDays(
  nextDate: number,
  now: number = Date.now(),
): string {
  const days = Math.ceil((nextDate - now) / ONE_DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 14) return `in ${days} days`;
  if (days <= 60) return `in ${Math.round(days / 7)} weeks`;
  if (days <= 365) return `in ${Math.round(days / 30)} months`;
  return "in over a year";
}

// "$129" for USD, "USD 129" for unknown symbols, "129" if no currency.
// Whole numbers only — gift price estimates are inherently approximate.
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export function formatPrice(amount?: number, currency?: string): string {
  if (amount == null) return "";
  const rounded = Math.round(amount);
  if (!currency) return String(rounded);
  const symbol = CURRENCY_SYMBOLS[currency];
  if (symbol) return `${symbol}${rounded}`;
  return `${currency} ${rounded}`;
}

// "stihl.com" from "https://www.stihl.com/gta-26". Falls back to the
// raw string if it can't be parsed. Used on IdeaCards everywhere a
// gift idea references a source URL.
export function shortenSource(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
