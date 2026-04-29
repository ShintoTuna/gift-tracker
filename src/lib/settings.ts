import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type Language,
} from "@/i18n";
import { setErrorReportsRuntime } from "@/lib/sentry";

import { api } from "../../convex/_generated/api";

// Initial fallback currency. Used when the user hasn't set one in
// the Settings screen yet (or when the Convex query is still
// resolving). Lives as a constant so any future cold-start default
// can change in one place.
export const DEFAULT_CURRENCY = "EUR";

// Reactive accessor for the user's chosen default currency. Reads
// from `api.userSettings.get`, falls back to `DEFAULT_CURRENCY`
// while the query is loading or if no preference is set yet.
//
// Components rendering price labels or attaching `currency` to
// mutations should use this hook (not the constant) so currency
// changes from the Settings screen propagate everywhere reactively.
export function useDefaultCurrency(): string {
  const settings = useQuery(api.userSettings.get);
  return settings?.defaultCurrency ?? DEFAULT_CURRENCY;
}

// Mirrors `useDefaultCurrency` but for the UI language. Read-side is
// served by i18next (which `LanguageGate` in _layout.tsx primes from
// AsyncStorage / Convex at boot). Write-side fans out to all three
// stores so the language survives cold boots, syncs across devices,
// and re-renders subscribed components without an app reload.
export function usePreferredLanguage(): {
  language: Language;
  setLanguage: (next: Language) => Promise<void>;
} {
  const { i18n } = useTranslation();
  const setPreferredLanguage = useMutation(api.userSettings.setPreferredLanguage);

  const language: Language = isSupportedLanguage(i18n.language)
    ? i18n.language
    : SUPPORTED_LANGUAGES[0];

  const setLanguage = useCallback(
    async (next: Language) => {
      // 1. Flip i18next first so the UI re-renders immediately.
      await i18n.changeLanguage(next);
      // 2. Persist to AsyncStorage so the next cold boot has zero
      //    flicker before the Convex query resolves.
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      } catch {
        // Best-effort; a missed cache write only costs a flicker on
        // the next boot, not correctness.
      }
      // 3. Persist to Convex so other devices for this user pick it
      //    up on next launch. Fire-and-forget — Convex retries
      //    transient failures.
      void setPreferredLanguage({ language: next });
    },
    [i18n, setPreferredLanguage],
  );

  return { language, setLanguage };
}

// Default seed for a fresh notification opt-in. The user is free to
// rewrite this list to anything (1..365, up to 10 entries) via the
// Settings screen. Lives here so the registrar component and the
// settings screen agree on the same default.
export const DEFAULT_REMINDER_DAYS_AHEAD: number[] = [1, 3, 7];
export const DEFAULT_REMINDER_TIME_OF_DAY_MINUTES = 9 * 60; // 09:00

export type NotificationPrefs = {
  enabled: boolean;
  daysAhead: number[];
  timeOfDayMinutes: number | null;
  timezone: string | null;
};

// Reactive accessor for the user's notification prefs. Mirrors the
// shape returned by `api.notifications.getNotificationPrefs`. Read
// returns null while the query is loading or pre-auth (the registrar
// + settings screen treat null as "not yet known" rather than "off").
export function useNotificationPrefs(): {
  prefs: NotificationPrefs | null;
  setPrefs: (patch: Partial<NotificationPrefs>) => Promise<void>;
} {
  const prefs = useQuery(api.notifications.getNotificationPrefs);
  const setNotificationPrefs = useMutation(
    api.notifications.setNotificationPrefs,
  );
  const setPrefs = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      await setNotificationPrefs({
        enabled: patch.enabled,
        daysAhead: patch.daysAhead,
        timeOfDayMinutes:
          patch.timeOfDayMinutes === null ? undefined : patch.timeOfDayMinutes,
        timezone: patch.timezone === null ? undefined : patch.timezone,
      });
    },
    [setNotificationPrefs],
  );
  return { prefs: prefs ?? null, setPrefs };
}

// Reactive accessor for the Sentry crash-reporting toggle. Default is
// on (so freshly-installed apps capture errors out of the box). The
// write side fans out three places: Sentry runtime (init/close +
// AsyncStorage cache for the next cold boot) and Convex (cross-device
// sync). Reads prefer Convex once it resolves and fall back to the
// default while loading.
export function useErrorReportsEnabled(): {
  enabled: boolean;
  setEnabled: (next: boolean) => Promise<void>;
} {
  const settings = useQuery(api.userSettings.get);
  const setOnServer = useMutation(api.userSettings.setErrorReportsEnabled);
  const enabled = settings?.errorReportsEnabled ?? true;
  const setEnabled = useCallback(
    async (next: boolean) => {
      // Flip Sentry + AsyncStorage first so the user's choice is
      // honored immediately — AsyncStorage is what the next cold-boot
      // gate consults.
      await setErrorReportsRuntime(next);
      void setOnServer({ enabled: next });
    },
    [setOnServer],
  );
  return { enabled, setEnabled };
}
