import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ru from "./locales/ru.json";

// Languages we ship translations for. Adding a new locale is:
//   1. Add a JSON file under ./locales/
//   2. Add the code here and to LANGUAGE_LABELS
//   3. Import + register it in `resources` below
// See CLAUDE.md (project root) for the translation workflow.
export const SUPPORTED_LANGUAGES = ["en", "ru"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

// Native-form labels so a user who picked the wrong language can find
// their way back without already speaking the current one.
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  ru: "Русский",
};

// AsyncStorage key for the boot-time language cache. Read from this
// before the Convex `userSettings` query resolves to avoid a flash of
// device-default copy when the user has previously chosen a language.
export const LANGUAGE_STORAGE_KEY = "giftsmith.language";

// Initial language: prefer device locale if it's one we support,
// otherwise fall back to English. The Convex/AsyncStorage-backed
// preference (when present) overrides this in `LanguageGate` at boot.
const deviceLang = Localization.getLocales()[0]?.languageCode ?? "en";
const initialLang: Language = (
  SUPPORTED_LANGUAGES as readonly string[]
).includes(deviceLang)
  ? (deviceLang as Language)
  : "en";

// `i18n.use(...)` is the documented i18next chain API. The
// `import/no-named-as-default-member` lint rule flags it because
// `use` is also a named export of `i18next`, but here it's the
// instance method on the default export.
// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: initialLang,
  fallbackLng: "en",
  // RN doesn't render HTML, so escaping interpolated values would
  // turn apostrophes etc. into entities like &#39; in the UI.
  interpolation: { escapeValue: false },
  // i18next returns `null` for missing keys by default; coerce to the
  // key string so a forgotten translation surfaces visibly in the UI
  // rather than a blank space.
  returnNull: false,
  // In development, log missing keys so a forgotten translation
  // doesn't silently fall through to English.
  saveMissing: __DEV__,
  missingKeyHandler: (lngs, _ns, key) => {
    if (__DEV__) {
      console.warn(`[i18n] Missing key "${key}" for language(s):`, lngs);
    }
  },
});

export function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export default i18n;
