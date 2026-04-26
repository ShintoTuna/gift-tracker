# Gift Planner & Personal Relationship Manager — PRD

**Status:** Draft v0.3
**Owner:** Nikita
**Last updated:** April 26, 2026

---

## 1. Overview

A mobile-first app that helps users capture gift ideas in the moment, manage the people who matter to them, and never miss an occasion. The core insight: gift ideas come at random times and places, but the moments you need them (birthdays, holidays, anniversaries) are predictable. Bridging that gap with a focused, AI-augmented capture-and-recall system is the product.

The app starts as a personal tool to solve a specific friction point and is designed to scale into a broader personal relationship management (PRM) system over time.

## 2. Problem Statement

Gift ideas are ephemeral — you spot something perfect for your mom in a shop window, hear a friend mention an interest in passing, or remember a great suggestion someone made — but by the time the occasion rolls around, you've forgotten. Existing tools fail because:

- **Notes apps** are too unstructured; ideas get buried and lost.
- **Reminders/calendar apps** track dates but not context.
- **Generic gift sites** don't know the person.
- **Contact apps** store info but don't synthesize it.

The result is last-minute, generic gifting and the recurring sense of "I had a great idea for them three months ago — what was it?"

## 3. Goals & Non-Goals

### Goals (MVP)
- Frictionless capture of gift ideas tied to people and/or occasions.
- Single source of truth for who's important and when their occasions are.
- Surface relevant gift ideas when an occasion approaches.
- AI-assisted suggestions based on accumulated context about each person.
- Built mobile-first, iOS first, for in-the-moment capture.
- Data architecture ready for paid tiers from day one (no monetization in MVP).
- Privacy and GDPR compliance baked into the product from the start.

### Non-Goals (MVP)
- Social features, sharing, or collaborative gifting.
- E-commerce integration or affiliate purchasing.
- Group gift coordination.
- Full PRM features (last-hangout tracking, conversation starters, etc.) — v2.
- Multi-user/team accounts.
- Android (post-validation).

## 4. Target User

Initial user: Nikita (dogfooding). The product is being built to solve a real personal problem first, then evaluated for broader appeal.

Eventual ICP: thoughtful gift-givers with 10–50 close relationships they want to maintain — typically late 20s to 50s, value relationships, find existing tooling inadequate.

## 5. Core User Flows

### 5.1 Capture an Idea (the moment-of-inspiration flow)
1. User opens app from home screen or share sheet.
2. Quick-add screen: text field, optional photo, optional URL.
3. Tag to one or more people (typeahead from existing contacts).
4. Optional: add price estimate, add note.
5. Save.

**Key requirement:** Sub-10-seconds end to end. Capture friction kills the product. Must work with intermittent connectivity (queued writes via Convex optimistic updates).

### 5.2 Browse Upcoming Occasions
1. Calendar view shows occasions chronologically.
2. Tap an occasion → see the person + all gift ideas tagged to them.
3. Mark gift as "given" with date and which occasion it satisfied.

### 5.3 Manage a Person
1. People list view, sorted by next upcoming occasion.
2. Person profile shows: occasions, interests, gift ideas (proposed + given history), notes.
3. AI suggestion CTA: "Help me find a gift for [Person]" surfaces ideas based on profile.

### 5.4 Gift Ideas Backlog
1. Standalone list of all captured ideas, filterable by person, price, status.
2. Useful for revisiting ideas not yet acted upon.

## 6. Data Model

### Entities

**User**
- `id`, `email`, `displayName`
- `subscriptionTier` ("free" | "plus" | "pro") — present from day 1, defaults to "free"
- `aiUsageThisPeriod` — counter for future metering
- `acceptedTermsVersion`, `acceptedTermsAt` — for ToS versioning
- `createdAt`

**Person**
- `id`, `userId` (owner)
- `name`, `nickname`, `photoUrl`
- `relationship` (mom, friend, partner, colleague, etc.)
- `interests[]` (free-form tags)
- `notes` (free text — sensitive, encrypted from v0.3, see §10–11)
- `dateMet` / `dateOfBirth` (optional)
- `createdAt`, `updatedAt`

**Occasion**
- `id`, `personId`, `type` (birthday, Christmas, anniversary, Mother's Day, custom)
- `date` (recurring or one-time)
- `recurrence` (yearly, one-off)
- `customLabel` (for non-standard occasions)

**GiftIdea**
- `id`, `userId`, `title`, `description`, `imageUrl`, `sourceUrl`
- `priceEstimate`, `currency`
- `taggedPeople[]` → many-to-many with Person
- `status` (idea, planned, purchased, given)
- `givenTo` / `givenAt` / `givenForOccasionId` (when status=given)
- `createdAt`, `updatedAt`

**ThirdPartyDeletionRequest** (admin-side, not user-facing)
- `id`, `requesterEmail`, `claimedPersonName`, `requestedAt`, `status`, `resolvedBy`, `resolvedAt`, `notes`
- Tracks deletion requests from non-users about their data being held.

### Key Design Decisions

- A gift idea is tagged to a **person**, not to an occasion. Occasions belong to people. When you view "Mom's birthday," the app pulls all ideas tagged to Mom — the occasion provides context for *when*.
- A gift idea can be tagged to multiple people (e.g., "nice whiskey glass" → both dad and brother).
- "Given" history is preserved per gift, so you don't accidentally repeat a gift.
- `subscriptionTier` exists on User from day 1 even though everything is free in MVP, so we never need a destructive migration when introducing tiers.
- `notes` field is the highest-risk data surface and gets encrypted before any external testing (see §11).

## 7. AI Features (MVP scope)

### 7.1 Gift Brainstorming Assistant
Given a person's profile (interests, past gifts, budget hint), generate 5–10 gift suggestions with reasoning. User can save any suggestion as an idea.

**Important:** The free-form `notes` field is **never** sent to AI providers. Only structured fields (interests, relationship, budget) are passed. This minimizes PII exposure to processors.

### 7.2 Idea Refinement
User captures vague ideas like "something for their gaming setup." AI helps expand into concrete suggestions.

### 7.3 Smart Surfacing
When an occasion is approaching (e.g., 2 weeks out), the app pushes a notification with the top relevant ideas already on file, plus 2–3 fresh AI-generated suggestions.

### Provider Strategy

**Default:** Claude Haiku 4.5 ($1/$5 per MTok) — fast, cheap, sufficient quality for brainstorming.
**Premium tier (future):** Claude Sonnet 4.6 ($3/$15) — for higher-quality, longer-context suggestions.

**Alternatives evaluated (April 2026 pricing):**

| Provider | Model | Input/Output ($/MTok) | Notes |
|---|---|---|---|
| Anthropic | Haiku 4.5 | $1 / $5 | Strong creative quality, good structured output |
| Anthropic | Sonnet 4.6 | $3 / $15 | Premium tier candidate |
| Google | Gemini 3 Flash | $0.50 / $3 | Cheapest reasonable option, worth A/B testing |
| Google | Gemini 3.1 Pro | $2 / $12 | Alternative premium option |
| OpenAI | GPT-5.2 | $1.75 / $14 | Expensive output, pricey for verbose responses |
| xAI | Grok 4.1 | $0.20 / $0.50 | Cheapest by far, quality varies |

### Implementation Notes
- Build a thin **AI provider abstraction** so we can swap models per-feature without rewrites.
- All AI calls happen server-side (Convex Action) — API keys never on device.
- Pass structured person context, not raw notes — keep prompts deterministic and minimize PII exposure.
- Cache suggestions for 24h per person to avoid redundant API calls.
- Track per-user AI call count for future metering on free tier.
- Prompt caching can drop costs ~90% on repeated context — worth using for system prompts.
- DPAs required with all providers (see §11).

## 8. Platform & Tech Stack

### Mobile App
- **React Native + Expo** (consistent with NextTurn experience).
- TypeScript throughout.
- **iOS only for MVP** — Android post-validation.

### Backend
- **Convex** — fastest path to production, real-time reactive queries by default, generous free tier.
- Convex Actions for AI provider calls (server-side, with secrets).
- Convex File Storage for photos.
- Self-host option preserved if scale economics demand it later.

### AI Layer
- Anthropic Claude API as default (Haiku 4.5).
- Provider abstraction allows runtime swap (Gemini, OpenAI).

### Authentication
- Convex Auth or Clerk (TBD — evaluate during initial setup).

## 9. Capture Optimizations

Because capture friction is the make-or-break of this product:

- **Share sheet integration:** Share any URL/image/text from another app directly into a gift idea, with person tagging in the share UI.
- **Quick widget:** iOS home screen widget for one-tap "new idea."
- **Voice capture (post-MVP):** Hold-to-record voice memo, transcribed on save.
- **Photo-first:** Snap a photo of an item in a shop, attach person + occasion later.
- **Optimistic writes:** Convex handles this — saves feel instant even on flaky networks.

## 10. Privacy

### The Concern
This app stores notes about real people in the user's life — interests, gift history, personal observations. Even in private testing with family, the operator (Nikita) being able to read others' notes is a problem. Privacy is a first-class concern, not a v2 feature.

### MVP Privacy Posture
- **Per-user data isolation:** Convex auth ensures each user only reads/writes their own records.
- **Operator access (acknowledged limitation):** As DB admin, the operator technically has access to all data. This is documented and disclosed to early testers.
- **PII minimization to AI:** When calling AI providers, pass only structured fields (interests, relationship, budget hints) — never the raw `notes` field.
- **Photo storage:** Convex File Storage; access-controlled per user.
- **Transit:** TLS by default (Convex).
- **At rest:** Convex's standard encryption.

### Roadmap to Stronger Privacy
- **v0.3 (before any external testing):** Field-level encryption for `notes` using a key derived from the user's password — operator can't read this field. Search and filter on this field becomes harder; accept the tradeoff.
- **v2:** Full client-side encryption (E2EE) for sensitive fields. AI features that require decrypted data prompt the user explicitly each time.
- **Ongoing:** Clear privacy policy. Right-to-export and right-to-delete from day one.

### Disclosure to Early Testers
A short, plain-language note on first launch / TestFlight invite stating exactly what the operator can and cannot see, until E2EE ships. **Field-level encryption for `notes` ships before opening to inner-circle testing.**

---

## 11. GDPR Compliance

> **This section is operationally critical.** The app stores personal data about non-users (the people being tracked), which is the single highest-risk aspect of the product from a regulatory standpoint.

### 11.1 Roles

- **Controller:** MONOCHROME ART OÜ (Estonia). The operator determines purposes and means of processing — including AI processing, data structures, retention.
- **Processors:** Convex (storage + compute), Anthropic / other AI providers (suggestion generation), App Store / TestFlight (distribution).
- **Data subjects:**
  - **Users** — the gift-givers using the app. Provide consent via ToS.
  - **Third-party data subjects** — the people being tracked (mom, friends, partners, colleagues). Have **not** consented and typically don't know they're in the system. This is the central compliance issue.

The "household exemption" (Article 2(2)(c)) does not apply to the operator's processing, only potentially to the user's individual use. The operator cannot rely on it.

### 11.2 Lawful Basis

- **For processing user data:** Consent + contract (Article 6(1)(a) and 6(1)(b)) via ToS at signup.
- **For processing third-party data subjects' data:** Legitimate interest (Article 6(1)(f)). A documented Legitimate Interests Assessment (LIA) must be on file before public release. See `gdpr-lia-template.md` for the starter template.

Special category data (Article 9 — health, religion, sexual orientation, etc.) is **prohibited** by ToS and excluded by design where possible. The free-text `notes` field is the residual risk surface; encryption (§10) is the technical control, ToS prohibition is the contractual control.

### 11.3 Compliance Controls

**Required before public release (v1.0):**

1. **Privacy Policy** explicitly addressing third-party data:
   - What data about non-users is stored.
   - Lawful basis (legitimate interest).
   - Rights of third-party data subjects.
   - Contact email for data requests.
   - Retention policy (default: while user account is active, plus 30 days after deletion).

2. **Terms of Service** with explicit user obligations:
   - User must not enter information about people who would object.
   - No special category data (health, religious, political, sexual orientation, biometric, etc.).
   - No information the user wouldn't share with the person directly.
   - User indemnifies operator for ToS violations.

3. **Data Processing Agreements (DPAs)** signed with:
   - Convex (standard SaaS DPA).
   - Anthropic (publicly available DPA).
   - Any other AI/infrastructure provider.

4. **Records of Processing Activities (ROPA)** under Article 30 — a 1–2 page document maintained internally, listing processing activities, purposes, categories of data and subjects, recipients, retention. Required because processing is "not occasional."

5. **Subject Access Request (SAR) workflow:**
   - Users: in-app data export (JSON), self-service deletion.
   - Third-party data subjects: email-based request flow → admin verifies and deletes records matching the claimed identity.

6. **Third-party deletion request mechanism:**
   - Public email address (e.g., privacy@[domain]).
   - Documented internal process: receive request → identify matching records (may require user collaboration if records are not directly searchable, e.g., due to encryption) → delete → respond within 30 days.
   - Tracked via the `ThirdPartyDeletionRequest` admin entity.

7. **Data breach response plan:**
   - Detection and notification within 72 hours to Andmekaitse Inspektsioon (Estonia's DPA).
   - Notification to affected data subjects when high risk.

8. **Documented Legitimate Interests Assessment (LIA)** — see separate template.

### 11.4 Risk Posture

- **Estonia regulator:** Andmekaitse Inspektsioon. Not aggressive on small consumer apps but responsive to complaints. Worth being on good terms with.
- **Realistic enforcement:** Complaint-driven. A single complaint from a third-party data subject can trigger inquiry and improvement orders.
- **Apple App Store review:** Privacy disclosures and a public privacy policy URL are required. Sloppy privacy posture is a rejection risk.
- **Reputational risk:** "Estonian developer's app stores secret notes about people without consent" is the worst-case headline. The compliance controls above defend against this both legally and narratively.

### 11.5 Compliance Roadmap

- **v0.1–0.2 (personal use only):** No external compliance work needed. Document decisions for later. Self-use does not trigger external obligations.
- **v0.3 (inner-circle testing, ≤10 people, all known):** Field-level encryption for `notes`. Plain-language privacy disclosure on first launch. ToS draft (even if informal). LIA drafted. ROPA started.
- **v1.0 (public release):** All controls in §11.3 in place. Privacy policy live. DPAs signed. Public privacy email. SAR workflow operational.
- **v2.0:** E2EE for sensitive fields. Re-evaluate LIA. Consider DPO appointment if user count or sensitivity warrants.

---

## 12. Cloud-First Architecture (Decided)

**Decision:** Cloud-first with Convex.

**Rationale:**
- Cross-device sync trivial — Convex is reactive by default.
- Account restore on new phone is a login, not a migration.
- Photo handling much cleaner cloud-side (avoid storage bloat on device).
- Server-side AI calls keep API keys safe and let us swap providers easily.
- Schema migrations happen in one place.

**Tradeoffs accepted:**
- Connectivity assumed for first-load — mitigated by Convex's optimistic writes and query cache.
- Operator access to data — addressed in §10–11.
- Vendor lock-in — Convex offers self-host as an escape hatch.

## 13. MVP Scope

### In Scope
- People CRUD with occasions.
- Gift ideas CRUD with multi-person tagging.
- Calendar view of upcoming occasions.
- Filtered ideas backlog.
- Convex-backed cloud storage with real-time sync.
- Photos in Convex File Storage.
- Basic AI brainstorming on a person's profile (Haiku 4.5).
- iOS share sheet capture.
- Notification reminders before occasions.
- User entity with `subscriptionTier` field (all free in MVP).
- Standard auth + clear privacy disclosure.
- Field-level encryption for `notes` (by v0.3, before external testers).

### Out of Scope (v0.1)
- Android.
- Web app.
- Voice capture.
- Calendar/contacts sync.
- E-commerce integration.
- Stripe / paid tier billing (architecture-ready, not implemented).
- End-to-end encryption (v2).
- Public release compliance package (privacy policy, ToS, DPAs, ROPA) — these come at v1.0.

## 14. Success Metrics

Since this starts as a personal tool, MVP success is qualitative:

- Personally captures ≥80% of gift ideas that occur to me.
- Reduces "what should I get them?" stress for the next 3 occasions.
- Used for >2 months without abandoning it.

If those hold, the next phase is sharing with 5–10 friends/family and tracking:
- Weekly active users.
- Ideas captured per user per month.
- Occasions "covered" with a non-empty idea list.
- AI suggestion accept-rate (to validate the AI provider choice).

## 15. Roadmap Sketch

### v0.1 — Personal MVP (4–6 weeks part-time)
Convex setup, core data model, 3 main views, manual entry, basic AI brainstorming via Haiku 4.5, iOS only. Single-user (Nikita) testing. Compliance: documentation only.

### v0.2 — Capture polish (2 weeks)
Share sheet, widget, photo capture, notifications.

### v0.3 — Privacy hardening + soft launch to inner circle (2–3 weeks)
**Field-level encryption for `notes` ships before testers join.** Plain-language privacy disclosure. Draft ToS, LIA, ROPA. Invite 5–10 people, instrument basic analytics, gather feedback.

### v1.0 — Public release
Android support, polished onboarding, Stripe integration for paid tier, paid AI tier (Sonnet 4.6). **Full compliance package live: privacy policy, ToS, DPAs, SAR workflow, third-party deletion process.**

### v2.0 — PRM expansion
Last-hangout tracking, relationship health signals, conversation starters, memory layer, full E2EE option.

---

## Appendix A: Resolved Open Questions

| Question | Decision |
|---|---|
| Local-first vs cloud-first | **Cloud-first** with Convex |
| Pricing model | Free in MVP; tier architecture in data model from day 1 |
| Privacy | Field-level encryption for notes by v0.3, E2EE on v2 roadmap |
| Photos | Cloud (Convex File Storage) |
| Cross-platform | **iOS only** until product-market fit; React Native ready for Android port |
| AI provider | Haiku 4.5 default, abstracted for swap, Sonnet 4.6 as premium tier |
| GDPR controller status | MONOCHROME ART OÜ is sole controller; legitimate interest is lawful basis for third-party data |

## Appendix B: Naming

Working title: TBD. Candidates to explore:
- Giftly / Giftd
- Kindling
- Reminder-themed: Marker, Beacon
- Relationship-themed: Kin, Circle, Tether
- Domain availability and trademark check needed before commitment.

## Appendix C: Related Documents

- `gdpr-lia-template.md` — Legitimate Interests Assessment template, to be filled before public release.
- `design-playbook.md` — Phased design prompts for screen mockups.
