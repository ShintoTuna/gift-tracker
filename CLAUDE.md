<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Convex deploy reminder

Anything under `convex/` (schema, queries, mutations, actions, crons,
auth config) only takes effect after `npx convex deploy` runs against
the target environment — the JS bundle on its own is not enough.

**Whenever a change touches files under `convex/`, explicitly tell the
user at the end of the task that they will need to run a Convex
deploy.** Call out which environment (dev vs. prod) is relevant if the
change implies one. This applies even when the diff is small (e.g. one
new index, a tweaked validator) — silent backend drift between the
client bundle and the deployed Convex functions is the most common
"works locally, broken in prod" failure mode for this project.

## Localization (i18n)

The app currently ships **seven** languages — English, Russian, Spanish,
French, German, Brazilian Portuguese, and Italian — using `i18next` +
`react-i18next`. The canonical list lives in `SUPPORTED_LANGUAGES` in
[`src/i18n/index.ts`](src/i18n/index.ts); always re-read that file before
making translation changes, since the set grows over time. All user-facing
strings live in `src/i18n/locales/<code>.json` (currently `en`, `ru`, `es`,
`fr`, `de`, `pt`, `it`). Components read strings via `useTranslation()` and
`t("namespace.key")`.

**Translation workflow:** when you add, change, or remove keys in
`src/i18n/locales/en.json`, also update **every** sibling locale file in
`src/i18n/locales/` to keep parity — not just `ru.json`. Skipping this is
the most common i18n regression: missing keys fall back to English at
runtime and removed keys silently rot. List the locales directory with
`ls src/i18n/locales/` first if unsure. Translations should be concise and
match the existing app tone. The English file is the source of truth.

**Plural rules:** Russian and Polish-family languages have multiple CLDR
plural forms — for Russian define `<key>_one`, `<key>_few`, `<key>_many`,
and `<key>_other` together. English, Spanish, French, German, Italian, and
Portuguese only need `<key>_one` and `<key>_other`.

**Adding a new language:** add the JSON file, the code to
`SUPPORTED_LANGUAGES` and `LANGUAGE_LABELS`, and the `resources` map in
`src/i18n/index.ts`. **Update this CLAUDE.md to mention the new language
in the list above so future translation work doesn't miss it.** The
Settings picker auto-renders the new option.

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
npm run web:export    # expo export -p web — catches web bundler regressions
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

## Sentry source maps (post-EAS-build verification)

Production JS errors come back from Sentry with Hermes-minified
stacks (`app:///main.jsbundle:1:NNN`) unless source maps are uploaded
during the EAS build. Without them, every issue is a guessing game.

The `@sentry/react-native/expo` plugin uploads maps automatically
when `SENTRY_AUTH_TOKEN` is set as an EAS env var (visibility
`secret`). Plugin args in `app.json` provide the org + project slug.

**After every `eas build`**, scan the build log for the upload step.
A successful upload looks like a block ending with `Source Map Upload
Report` and one or more `Bundle: …` / `Source Map: …` entries with
their `Debug ID`s. If that block is missing, the next batch of
production errors will be unsymbolicated — fix before merging the
build to a release channel.

To verify symbolication end-to-end after a build:

1. Trigger any error from the new build (e.g., via a temporary dev
   button that throws).
2. Open the event in Sentry. The stack should reference `src/...`
   files with original line numbers, not `main.jsbundle`.
3. Issues are grouped by release identifier
   `<bundleId>@<version>+<build>` (e.g.
   `com.shatunov.giftsmith@1.0.0+7`); confirm the new release
   appears at https://shintotuna.sentry.io/releases/.

## Web build (Cloudflare Workers)

The web app is a separate deploy target from the marketing site.
Two wrangler configs live at the repo root:

- `wrangler.jsonc` — marketing site (`./site`).
- `wrangler.app.jsonc` — web app (`./dist`, SPA fallback).

```bash
npm run web:export    # expo export -p web → ./dist
npm run web:deploy    # exports + wrangler deploy --config wrangler.app.jsonc
```

`EXPO_PUBLIC_CONVEX_URL` must be set when exporting (same as native).
On the Convex side, set `WEB_SITE_URL` in the dashboard env to the
production app origin so the OAuth redirect allowlist accepts it
(see `convex/auth.ts`).

CI deploys go through `.github/workflows/web-deploy.yml`
(workflow_dispatch). It needs the repo secrets
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and
`EXPO_PUBLIC_CONVEX_URL`. The workflow injects `noindex` meta tags
and a `Disallow: /` robots.txt into the bundle so the
unadvertised `*.workers.dev` URL won't get crawled. Don't link the
deploy URL from README, the marketing site (`./site`), or sitemaps.

Push notifications, Apple Sign-in, expo-secure-store, and Sentry
are no-ops on web (file-input image upload, full-page OAuth
redirect, and the in-memory token storage take their place). Adding
features that depend on native-only modules requires either a
`.web.ts` shim or a `Platform.OS` guard.
