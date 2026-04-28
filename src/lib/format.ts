// Display-side formatters for occasions, dates, and prices. Server
// returns raw timestamps + occasion titles + numeric amounts; this
// module turns those into the strings that show up on rows, chips,
// and cards.
//
// These helpers import the i18n instance directly rather than going
// through `useTranslation()` — they're pure functions called from
// inside JSX renders, and the caller's `useTranslation()` subscription
// already triggers re-renders on language change.

import i18n from "@/i18n";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Locale-aware short month-day formatter ("May 15" vs "15 мая"). The
// timeZone:UTC keeps it stable when stored timestamps are
// midnight-UTC (occasions) or sentinel-year UTC (birth dates).
function shortMonthDay(date: Date): string {
  return new Intl.DateTimeFormat(i18n.language, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

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
  let suffix: string;
  if (days <= 0) {
    suffix = i18n.t("format.today");
  } else if (days === 1) {
    suffix = i18n.t("format.tomorrow");
  } else if (days <= 14) {
    suffix = i18n.t("format.inDays", { count: days });
  } else {
    suffix = shortMonthDay(new Date(opts.nextDate));
  }
  return i18n.t("format.dateLine", { title: opts.title, suffix });
}

// "May 15" — month + day only, year intentionally ignored. Birth
// dates are stored with year=2000 sentinel for privacy; this helper
// extracts only the parts we surface.
export function formatBirthMonthDay(ms?: number): string | null {
  if (ms == null) return null;
  return new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(ms));
}

// "October 2026" / "October 2026 г." (depending on locale). For
// Calendar agenda section headers grouped by year+month. Caller
// passes a year-month key in "YYYY-MM" format.
export function formatMonthLabel(yearMonthKey: string): string {
  const [yearStr, monthStr] = yearMonthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return yearMonthKey;
  // Construct as a UTC date so it doesn't drift across timezones.
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// "Annual · May 15" / "Once · Jun 12" / "Date TBD". For the
// Occasions section on the Profile screen.
export function formatOccasionLine(opts: {
  recurrence?: "yearly" | "one_off";
  date?: number;
}): string {
  if (opts.date == null) return i18n.t("format.dateTBD");
  const monthDay = shortMonthDay(new Date(opts.date));
  const recurrence = opts.recurrence ?? "one_off";
  const key = recurrence === "yearly" ? "format.occasionAnnual" : "format.occasionOnce";
  return i18n.t(key, { date: monthDay });
}

// "today" / "tomorrow" / "in 5 days" / "in 3 weeks" / "in 4 months".
// No occasion-title prefix — the caller already shows the title
// alongside, so this is just the relative countdown.
//
// Russian gets four CLDR plural forms (one / few / many / other) for
// each unit; i18next picks the right one based on `count`.
export function formatRelativeDays(
  nextDate: number,
  now: number = Date.now(),
): string {
  const days = Math.ceil((nextDate - now) / ONE_DAY_MS);
  if (days <= 0) return i18n.t("format.today");
  if (days === 1) return i18n.t("format.tomorrow");
  if (days <= 14) return i18n.t("format.inDays", { count: days });
  if (days <= 60) return i18n.t("format.inWeeks", { count: Math.round(days / 7) });
  if (days <= 365) return i18n.t("format.inMonths", { count: Math.round(days / 30) });
  return i18n.t("format.inOverAYear");
}

// "$129" for USD, "USD 129" for unknown symbols, "129" if no currency.
// Whole numbers only — gift price estimates are inherently approximate.
//
// Currency formatting is keyed by ISO code (USD, EUR, …), independent
// of UI language — a "$129" price stays "$129" whether the rest of
// the app is in English or Russian.
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
