// Pure helpers for push notification dispatch. Lives separate from
// `convex/notifications.ts` so the cron action can stay focused on
// orchestration and the message-shaping / Expo-API logic is unit-able.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type PushLanguage = "en" | "ru";

export type ExpoMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export function buildExpoMessage(args: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): ExpoMessage {
  return {
    to: args.token,
    sound: "default",
    title: args.title,
    body: args.body,
    data: args.data,
  };
}

export function chunk<T>(arr: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

type ExpoTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error?: string } };

type ExpoResponse = { data?: ExpoTicket[] };

// Returns the count of successfully-accepted tickets and the list of
// tokens that Expo reported as no longer registered with APNs. The
// caller prunes those rows from `pushTokens`.
export function parseExpoTickets(
  response: ExpoResponse,
  sentTokensInOrder: string[],
): { ok: number; deviceNotRegisteredTokens: string[] } {
  const tickets = response.data ?? [];
  let ok = 0;
  const deviceNotRegisteredTokens: string[] = [];
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    if (t.status === "ok") {
      ok++;
      continue;
    }
    if (t.details?.error === "DeviceNotRegistered") {
      const token = sentTokensInOrder[i];
      if (token) deviceNotRegisteredTokens.push(token);
    }
  }
  return { ok, deviceNotRegisteredTokens };
}

export async function postToExpo(messages: ExpoMessage[]): Promise<ExpoResponse> {
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    throw new Error(`Expo push HTTP ${res.status}`);
  }
  return (await res.json()) as ExpoResponse;
}

// Russian CLDR plural picker for integer counts. Mirrors the rules
// i18next applies on the client so server-side push body strings
// stay grammatically correct in Russian.
function pluralRu(
  count: number,
  forms: { one: string; few: string; many: string; other: string },
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms.one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few;
  if (mod10 === 0 || (mod10 >= 5 && mod10 <= 9) || (mod100 >= 11 && mod100 <= 14))
    return forms.many;
  return forms.other;
}

function pluralEn(
  count: number,
  forms: { one: string; other: string },
): string {
  return count === 1 ? forms.one : forms.other;
}

// Server-side push body string table. Mirrors the `push.*` keys in
// src/i18n/locales/{en,ru}.json — keep these in sync. We don't pull
// i18next into Convex (overkill for ~6 strings), so any change to the
// English copy on the client should be reflected here too.
export function renderPushTitle(
  language: PushLanguage,
  args: { personName: string; occasionTitle: string },
): string {
  // Same shape in en + ru.
  return `${args.personName} · ${args.occasionTitle}`;
}

export function renderPushBody(
  language: PushLanguage,
  args: { personName: string; occasionTitle: string; daysAhead: number },
): string {
  const { personName, occasionTitle, daysAhead } = args;
  if (daysAhead === 0) {
    return language === "ru"
      ? `${occasionTitle} (${personName}) — сегодня.`
      : `${occasionTitle} for ${personName} is today.`;
  }
  if (daysAhead === 1) {
    return language === "ru"
      ? `${occasionTitle} (${personName}) — завтра.`
      : `${occasionTitle} for ${personName} is tomorrow.`;
  }
  if (language === "ru") {
    const word = pluralRu(daysAhead, {
      one: "день",
      few: "дня",
      many: "дней",
      other: "дня",
    });
    return `${occasionTitle} (${personName}) через ${daysAhead} ${word}.`;
  }
  const word = pluralEn(daysAhead, { one: "day", other: "days" });
  return `${occasionTitle} for ${personName} is in ${daysAhead} ${word}.`;
}

export function normalizeLanguage(input: string | undefined | null): PushLanguage {
  return input === "ru" ? "ru" : "en";
}
