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

## Pre-merge / pre-build verification

EAS cloud builds are slow and metered — a failed iOS build wastes ~15
minutes of build minutes and a round-trip to debug. Treat them as the
last step, not a sanity check. Before merging a PR, **and** before
triggering any `eas build`, run all three of these locally and
require they exit 0:

```bash
npx expo-doctor       # native module / SDK version mismatches
npm run lint          # eslint via expo lint
npx tsc --noEmit      # strict typecheck across src/ and convex/
```

`expo-doctor` is the most important of the three for catching what
fails on EAS but passes locally. Native module version drift (e.g. a
package pinned to its old SDK-N major when the project is now on
SDK-N+1) compiles fine in JS but breaks Swift/ObjC compilation in the
cloud. If it flags mismatches, run `npx expo install --fix` to
reconcile, re-run all three, and commit `package.json` +
`package-lock.json` together.

When adding a new dependency, prefer `npx expo install <pkg>` over
plain `npm install <pkg>` — it picks the version pinned to the
current Expo SDK and saves you the doctor cycle.

If a new check earns its keep (e.g. running tests when they exist,
or `npx convex dev --once` to confirm schema validates), add it to
this list rather than relying on people remembering.
