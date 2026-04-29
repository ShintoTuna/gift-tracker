# Public Release Plan — Gift Tracker

> Development scope for v1.0 public launch. This document covers **what to build**.
> For the release *process* (TestFlight, EAS, Apple Developer setup), see [`release.md`](./release.md).

## Context

Gift Tracker is an Expo + React Native + Convex iOS-first app for capturing gift ideas, tagging people, and surfacing occasions. The 4 tabs (People, Calendar, Backlog, Settings) and the Quick Capture modal all work end-to-end with real Convex data; the Midnight Garden design system is fully built; i18n is solid (en + ru, full coverage); TypeScript is strict; the codebase is clean (no real TODO/FIXME debt).

The project is feature-complete for **personal dogfooding** but has a hardcoded `DEV_USER_ID` and is missing several gates required for a real public iOS release. This plan answers the question *"what should I build before public launch?"*

## Decisions taken

| Area | Decision |
|---|---|
| Paywall | Ship **free with sanity limits** (e.g. 100 people / 200 ideas). Architect around tiers so a paid tier can be added later. |
| AI brainstorming | **Defer** — hide brainstorm entry points. |
| Notifications | **Server-side push** via Convex scheduler + APNs. |
| Notes encryption | **Skip** — remove the `notes` field from `people` entirely. |

---

## Scope: BLOCKING for launch

### 1. Real authentication (replace `DEV_USER_ID`)
The whole app currently calls `getCurrentUserId()` which returns `"dev-user-1"`. This is the biggest single block.

- Wire **Convex Auth** (email + password). Schema's `userId: v.string()` columns are already auth-portable.
- New `(auth)` route group: `login.tsx`, `signup.tsx`, `forgot-password.tsx`.
- Email verification flow.
- Password reset flow.
- Session persistence (Convex Auth handles this; verify on app launch).
- Logout from Settings.
- **Files to touch:** `convex/lib/auth.ts` (replace stub), `src/lib/devAuth.ts` (delete), `convex/auth.config.ts` (new), `src/app/_layout.tsx` (auth gate), every Convex query/mutation that calls `getCurrentUserId()` (ID becomes real, not literal string).

### 2. Account deletion
**Mandatory by App Store guidelines.**
- New Convex mutation `users.deleteAccount` that cascades: deletes the user's people, occasions, gift ideas, settings, push token, then the user record itself, in one transaction.
- Settings → Account → "Delete account" with destructive confirmation modal (translated).
- After deletion: sign out + return to login.

### 3. Sanity limits + tier architecture (to enable later monetization)
- Add `subscriptionTier: "free" | "plus" | "pro"` (default `"free"`) to the `users` table; the field is already in the schema design — confirm and surface it.
- Centralized `convex/lib/limits.ts` exposing per-tier caps:
  ```
  free: { maxPeople: 100, maxGiftIdeas: 200, maxOccasionsPerPerson: 20 }
  plus: { ... } // placeholder, gated until tier ships later
  pro:  { ... }
  ```
- Enforce in `people.create`, `giftIdeas.create`, `occasions.create` — throw a typed error (`LimitReachedError`) so the UI can show a friendly message ("You've reached the free plan's 100-person limit").
- Settings → Account: show usage like `Gift ideas: 84 / 200`.
- This is the architectural seam for a future paywall — **no StoreKit / RevenueCat at launch**.

### 4. Drop the `notes` field
- Remove from `convex/schema.ts` (`people.notes`).
- Remove from `EditPerson` form, NewPerson form, person detail view, any i18n strings.
- Convex schema migration: data is dev-only so can be dropped without backfill.

### 5. Push notifications (server-side)
- Add `expo-notifications`; configure `app.json` with `notifications` plugin and APNs entitlement.
- New Convex table `pushTokens { userId, token, platform, createdAt }`.
- New mutation `notifications.registerToken` called on app launch after auth.
- Convex scheduler (`crons.daily`) that, at user's preferred local time, scans upcoming occasions for that user and dispatches a push N days ahead (default 7, 3, 1).
- Notifications.ts library to actually send to APNs (Expo's push API is simplest if we want to skip raw APNs).
- Settings → Notifications:
  - Master toggle
  - Days-ahead (multi-select: 1 / 3 / 7)
  - Time-of-day picker
- **User responsibility:** APNs cert generation in Apple Developer + Expo push credentials setup. Surface the exact `eas credentials` commands when we get there.
- **Files:** new `convex/notifications.ts`, new `convex/crons.ts`, new `src/lib/notifications.ts`, additions to `src/app/settings.tsx` and `_layout.tsx` (permission prompt).

### 6. Image upload (people photos + gift idea images)
The schema and UI already presuppose images (`Avatar` falls back to initials, `IdeaCard` has a thumbnail block) — without uploads, the app feels half-finished.
- Add `expo-image-picker` and `expo-image-manipulator` (compress + resize before upload).
- Use Convex File Storage (`ctx.storage.generateUploadUrl()`).
- Wire image picker into:
  - `people/new.tsx` and `people/[id]/edit.tsx` (avatar)
  - `capture.tsx` (idea image)
  - `idea/[id].tsx` (idea image edit)
- Display via `expo-image` (caching).
- **New helper:** `src/lib/imageUpload.ts`.

### 7. Crash reporting (Sentry)
- `@sentry/react-native` (or `sentry-expo`).
- Wrap root in `Sentry.ErrorBoundary` in `src/app/_layout.tsx`.
- Initialize with DSN in `app.config.ts` extras.
- Settings → About → "Send error reports" toggle (default on).
- **User responsibility:** create the Sentry project, hand over the DSN.

### 8. Onboarding + empty states polish
- One-screen welcome **post-signup** explaining the flow (Add people → Capture ideas → Get reminders). Skippable.
- Improve empty states for People, Calendar, Backlog with primary CTAs ("Add your first person", "Capture your first idea") — currently minimal.
- Files: `src/app/(tabs)/index.tsx`, `calendar.tsx`, `backlog.tsx`; new `src/app/welcome.tsx`.

### 9. Settings: Account / Notifications / About sections
The settings screen has a stub comment `// Account / Notifications / About sections slot in here` — fill it in:
- **Account:** email, change password, sign out, delete account, usage stats.
- **Notifications:** see §5.
- **About:** app version (`Application.nativeApplicationVersion`), Privacy Policy link, Terms of Service link, "Send feedback" (mailto), "Send error reports" toggle.

### 10. Privacy / Terms in-app links
- External-URL links from About section. User hosts the actual pages.

### 11. Hide the Brainstorm stub
- Remove the entry-point button(s) that link to `brainstorm/[personId].tsx`.
- Keep the route file (handy for later) but make it unreachable from the UI in v1.0.

---

## Scope: STRONGLY RECOMMENDED (ship-with)

### 12. Convex query error / timeout states
Today, if a Convex query fails after returning `undefined`, screens spin forever. Add a top-level `ConvexErrorBoundary` and a global `useConvexAuth` listener; show a "Reconnecting…" banner on disconnect.

### 13. Server-side input validation
Add max-length and basic-format checks in mutations (`title ≤ 200`, `description ≤ 2000`, valid currency code, valid relationship enum). Currently most validation is client-only.

### 14. Accessibility pass
Only ~6 a11y attributes in the entire app. Add `accessibilityLabel` to every `Pressable`, run a VoiceOver pass on all 4 tabs + Capture. Verify Midnight Garden contrast ratios meet WCAG AA on key text.

### 15. Lint + typecheck CI
- Add `"typecheck": "tsc --noEmit"` script.
- GitHub Actions workflow at `.github/workflows/ci.yml`: runs `npm run lint`, `npm run typecheck`, `npx expo-doctor` on PR.

### 16. Basic analytics (PostHog or similar)
Highly recommended for a public launch — track signup, first-capture, first-given. Optional, can defer 1-2 weeks post-launch if needed. **User would create the PostHog project and provide the key.**

---

## Scope: POST-LAUNCH (deferred)

These are intentionally out of v1.0 scope per decisions taken:

- **AI brainstorming** (Claude Haiku 4.5) — needs Convex action + usage metering UI + per-tier caps.
- **StoreKit / RevenueCat / paid tier UX** — the tier *architecture* lands at launch (§3), the *payment surface* comes later.
- **Field-level encryption for any sensitive field.**
- **Light mode** — design tokens hardcode dark; deferred.
- **Share extension** (Safari → Capture).
- **Contacts import.**
- **Data export** (GDPR portability) — nice to add, but compliance handled separately.
- **Test suite** — no tests exist; consider a minimum bar (date helpers + Convex mutation tests) post-launch.

---

## Suggested sequencing (rough, ~4–5 weeks solo)

1. **Week 1–2:** Auth (§1) + account deletion (§2) + drop notes field (§4). Auth unblocks everything else.
2. **Week 2:** Sanity limits + tier architecture (§3).
3. **Week 3:** Image upload (§6).
4. **Week 3–4:** Push notifications (§5) — APNs cert work happens in parallel (user-driven).
5. **Week 4:** Sentry (§7), onboarding/empty states (§8), Settings sections (§9), brainstorm hide (§11), privacy/terms links (§10).
6. **Week 5:** Convex error states (§12), server validation (§13), a11y pass (§14), CI workflow (§15), analytics if going (§16).

## Critical files (touched repeatedly)

- `convex/lib/auth.ts` — auth identity source
- `convex/schema.ts` — drop `notes`, confirm `subscriptionTier`
- `convex/lib/limits.ts` (new) — tier caps
- `convex/notifications.ts` + `convex/crons.ts` (new)
- `src/app/_layout.tsx` — auth gate, error boundary, push registration
- `src/app/(auth)/*` (new tree)
- `src/app/settings.tsx` — Account / Notifications / About sections
- `src/lib/imageUpload.ts` (new), `src/lib/notifications.ts` (new)
- `src/app/capture.tsx`, `people/new.tsx`, `people/[id]/edit.tsx`, `idea/[id].tsx` — image picker integration
- `src/i18n/locales/en.json` + `ru.json` — every new user-facing string in both, with Russian CLDR plurals where needed

## Verification

For each shipped item, end-to-end check on a TestFlight build:

1. **Auth:** sign up → verify email → log out → log in → forgot password → reset → log in. Re-launch app → still logged in.
2. **Account deletion:** delete account → confirm all rows gone in Convex dashboard → log-in attempt fails.
3. **Sanity limits:** seed 100 people via dev tool → 101st throws friendly error in UI.
4. **Notes removal:** schema deploy clean, no UI references, no Convex type errors.
5. **Push notifications:** create occasion 8 days out → confirm scheduled push lands on device 7/3/1 days ahead at preferred time. Toggle off → confirm cancelled.
6. **Image upload:** add person with photo → restart app → photo persists. Same for idea image. Test 5MB+ source image (compression).
7. **Sentry:** force-throw in a screen → confirm event in Sentry dashboard.
8. **Onboarding:** fresh install → welcome → tabs land on populated empty states with CTAs.
9. **Settings:** every link/toggle works; version number displays correctly.
10. **a11y:** VoiceOver swipe-through reads sensible labels on all 4 tabs + Capture.
11. **CI:** open a PR with a deliberate type error — CI blocks merge.

Run before TestFlight submission: `npx expo-doctor`, `npm run lint`, `npm run typecheck`, `eas build --profile production --platform ios`.
