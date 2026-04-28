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

// Future candidates that will land here as features arrive:
// - DEFAULT_REMINDER_DAYS_AHEAD (notifications threshold)
// - PREFERRED_AI_MODEL          (Claude Haiku vs Sonnet)
