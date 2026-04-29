<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Localization (i18n)

The app ships in English + Russian using `i18next` + `react-i18next`. All
user-facing strings live in `src/i18n/locales/<code>.json`. Components read
strings via `useTranslation()` and `t("namespace.key")`.

**Translation workflow:** when you add or change keys in
`src/i18n/locales/en.json`, also update every sibling locale file
(`ru.json`, etc.) to keep parity. Translations should be concise and match
the existing app tone. The English file is the source of truth.

**Russian plural rules:** Russian has four CLDR plural forms — define
`<key>_one`, `<key>_few`, `<key>_many`, and `<key>_other` together. English
only needs `<key>_one` and `<key>_other`.

**Adding a new language:** add the JSON file, the code to
`SUPPORTED_LANGUAGES` and `LANGUAGE_LABELS`, and the `resources` map in
`src/i18n/index.ts`. The Settings picker auto-renders the new option.
