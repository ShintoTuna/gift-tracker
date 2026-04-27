# Occasion Typing Simplification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the occasions `type` enum + `customLabel` + required `date` model with a free-text `title` and optional `date`/`recurrence`, supporting dateless "TBD" occasions.

**Architecture:** Single coordinated change touching schema, server helpers, server queries, client format helpers, two screens, and seed data. The server↔client TypeScript signatures change together, so the working tree can't be cleanly split into separately-compilable mini-commits — we'll edit all 8 files, verify end-to-end, then make one commit. Pre-flight: clear the existing 12 occasion rows from the cloud Convex deployment so the new schema deploys cleanly (rows that don't match the new shape would block the deploy).

**Tech Stack:** TypeScript, Convex (backend + schema), React Native + Expo Router (client). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-27-occasion-typing-design.md`.

---

## File Structure

**Files modified (8 total, no creates or deletes):**

| File | Responsibility |
|---|---|
| `convex/schema.ts` | Drop `type`/`customLabel` from `occasions`, add `title`, make `date`/`recurrence` optional |
| `convex/lib/dates.ts` | `getNextOccurrence` returns `null` when `date` is missing; treats absent `recurrence` as `one_off` |
| `convex/lib/seedData.ts` | `OccasionSeed` shape changes; SEED_OCCASIONS uses titles; Priya's "Housewarming" becomes dateless; `GiftIdeaSeed.givenForOccasionType` → `givenForOccasionTitle` |
| `convex/seed.ts` | Insert call uses `title`, conditionally includes `date`/`recurrence`; lookup map renamed and keyed by title |
| `convex/people.ts` | `listWithNextOccasion` adds `occasionCount` field |
| `src/lib/format.ts` | Delete `occasionTypeName` + `TYPE_NAMES`; `formatDateLine` takes `title`; `formatOccasionLine` handles missing date |
| `src/app/(tabs)/index.tsx` | `dateLineFor` uses `occasionCount` to distinguish "Pending date" from "No upcoming occasions" |
| `src/app/people/[id].tsx` | Replace `occasionTypeName(occ.type, occ.customLabel)` with `occ.title` |

---

## Task 1: Clear existing occasion data

**Files:** None — manual step in the Convex dashboard.

This MUST happen before the schema deploy in Task 2. Without clearing, `npx convex dev` will refuse the new schema because the existing 12 rows have `type`/`customLabel` (no longer in schema) and lack `title` (now required).

- [ ] **Step 1: Open the Convex cloud dashboard**

URL: https://dashboard.convex.dev/d/energized-akita-584

- [ ] **Step 2: Navigate to Data → occasions**

Click "Data" in the left nav, then click the `occasions` table.

- [ ] **Step 3: Delete all rows**

Select all rows (header checkbox) → click the trash icon → confirm. The table should now show 0 rows.

- [ ] **Step 4: Verify other tables are intact**

Click `people` (should still show 5 rows: Sarah, Alex, Jordan, Tom, Priya), `giftIdeas` (12 rows), `users` (0 rows). Only `occasions` should be empty.

(No commit — this task only touches the cloud database.)

---

## Task 2: Apply schema and code changes

**Files modified:** all 8 listed in File Structure.

The codebase will be in an intermediate broken-compile state between steps in this task. tsc/lint/bundle verification happens at the end of Task 2, after all 8 files are coherent. If any earlier step's edit produces a clearly-wrong result, fix before moving on.

### Step 1: Edit `convex/schema.ts` (occasions table)

Replace the existing `occasions` block (lines roughly 50-66 in the current file) with:

```ts
  occasions: defineTable({
    personId: v.id("people"),
    title: v.string(),
    date: v.optional(v.number()),
    recurrence: v.optional(
      v.union(v.literal("yearly"), v.literal("one_off")),
    ),
  })
    .index("by_person", ["personId"])
    .index("by_date", ["date"]),
```

- [ ] **Open `convex/schema.ts`**
- [ ] **Replace the occasions block with the code above**

The `users`, `people`, and `giftIdeas` tables stay untouched. Indexes on occasions stay the same.

### Step 2: Edit `convex/lib/dates.ts`

Replace the entire file body with:

```ts
// Date helpers for occasion math. Lives server-side so the same
// "next-occurrence" logic backs the People list and the upcoming
// Calendar screen.

type OccasionLike = {
  date?: number;
  recurrence?: "yearly" | "one_off";
};

// Returns the ms-timestamp of the next occurrence of `occasion` at or
// after `now`, or null if there's nothing upcoming. Three null cases:
//   1. The occasion has no date set ("TBD" — gift moment without
//      scheduled date).
//   2. It's a one-off whose date has passed.
//   3. It's a yearly with no date — same as case 1.
//
// Yearly recurrence projects the canonical (UTC month, day) into the
// next upcoming year. UTC arithmetic — local-timezone refinements
// come later if this proves insufficient.
export function getNextOccurrence(
  occasion: OccasionLike,
  now: number = Date.now(),
): number | null {
  if (occasion.date == null) return null;
  const recurrence = occasion.recurrence ?? "one_off";
  if (recurrence === "one_off") {
    return occasion.date >= now ? occasion.date : null;
  }
  const stored = new Date(occasion.date);
  const month = stored.getUTCMonth();
  const day = stored.getUTCDate();
  const today = new Date(now);
  let candidate = Date.UTC(today.getUTCFullYear(), month, day);
  if (candidate < now) {
    candidate = Date.UTC(today.getUTCFullYear() + 1, month, day);
  }
  return candidate;
}
```

- [ ] **Open `convex/lib/dates.ts`**
- [ ] **Replace the file content with the code above**

### Step 3: Edit `convex/lib/seedData.ts`

Three sub-edits in this file:

**Sub-edit 3a: Replace the type definitions**

Find the existing `OccasionSeed` and `GiftIdeaSeed` type aliases. Replace with:

```ts
export type OccasionSeed = {
  title: string;
  date?: number;
  recurrence?: "yearly" | "one_off";
};

export type GiftIdeaSeed = {
  title: string;
  description?: string;
  sourceUrl?: string;
  priceEstimate?: number;
  currency?: string;
  taggedPersonNames: string[];
  status: "idea" | "planned" | "purchased" | "given";
  givenToPersonName?: string;
  givenAt?: number;
  // For matching against the seeded occasions when status === "given".
  givenForOccasionTitle?: string;
};
```

The change: `OccasionSeed` drops `type`/`customLabel`, adds `title`, makes `date`/`recurrence` optional. `GiftIdeaSeed` renames `givenForOccasionType` → `givenForOccasionTitle`.

**Sub-edit 3b: Replace the SEED_OCCASIONS export**

Find the existing `SEED_OCCASIONS` const. Replace with:

```ts
export const SEED_OCCASIONS: Record<string, OccasionSeed[]> = {
  Sarah: [
    { title: "Birthday", date: ms("1962-05-15"), recurrence: "yearly" },
    { title: "Mother's Day", date: ms("2026-05-10"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Alex: [
    { title: "Birthday", date: ms("1991-05-03"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Jordan: [
    { title: "Birthday", date: ms("1992-11-23"), recurrence: "yearly" },
    { title: "Anniversary", date: ms("2022-09-05"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Tom: [
    { title: "Birthday", date: ms("1989-02-08"), recurrence: "yearly" },
    { title: "Christmas", date: ms("2026-12-25"), recurrence: "yearly" },
  ],
  Priya: [
    { title: "Birthday", date: ms("1990-10-18"), recurrence: "yearly" },
    // Dateless: friend bought a house, will throw a housewarming
    // eventually but the date isn't known yet.
    { title: "Housewarming" },
  ],
};
```

Key change vs. before: every entry uses `title` instead of `type`/`customLabel`. Priya's "Housewarming" loses its `date` and `recurrence` (becomes dateless TBD). All other entries remain dated and yearly.

**Sub-edit 3c: Update SEED_GIFT_IDEAS for the renamed field**

Find the entries that use `givenForOccasionType` (there are two, both for Sarah's "given" gifts). Rename the field and use the title string:

```ts
// Find:
{
  title: "Audiobook subscription (annual)",
  ...
  givenForOccasionType: "birthday",
}
// Replace with:
{
  title: "Audiobook subscription (annual)",
  ...
  givenForOccasionTitle: "Birthday",
}

// Find:
{
  title: "Tea sampler — single estate",
  ...
  givenForOccasionType: "christmas",
}
// Replace with:
{
  title: "Tea sampler — single estate",
  ...
  givenForOccasionTitle: "Christmas",
}
```

Other gift-idea entries don't have a `givenForOccasionType` field and don't need changes.

- [ ] **Open `convex/lib/seedData.ts`**
- [ ] **Apply sub-edit 3a (replace type definitions)**
- [ ] **Apply sub-edit 3b (replace SEED_OCCASIONS)**
- [ ] **Apply sub-edit 3c (rename `givenForOccasionType` → `givenForOccasionTitle` on the two given-status ideas)**

### Step 4: Edit `convex/seed.ts`

Two sub-edits in the seed mutation:

**Sub-edit 4a: Update the occasions insert loop**

Find the existing block (it inserts each occasion using `occ.type`, `occ.date`, `occ.recurrence`, `occ.customLabel`):

```ts
    let occasionsCount = 0;
    const occasionIdByPersonAndType = new Map<
      string,
      Map<string, Id<"occasions">>
    >();
    for (const [personName, occasions] of Object.entries(SEED_OCCASIONS)) {
      const personId = personIdByName.get(personName);
      if (!personId) continue;
      const byType = new Map<string, Id<"occasions">>();
      for (const occ of occasions) {
        const id = await ctx.db.insert("occasions", {
          personId,
          type: occ.type,
          date: occ.date,
          recurrence: occ.recurrence,
          customLabel: occ.customLabel,
        });
        byType.set(occ.type, id);
        occasionsCount += 1;
      }
      occasionIdByPersonAndType.set(personName, byType);
    }
```

Replace with:

```ts
    let occasionsCount = 0;
    // Lookup map keyed by title — used in the next pass to resolve
    // `givenForOccasionTitle` on "given" gift ideas back to a real
    // occasion id.
    const occasionIdByPersonAndTitle = new Map<
      string,
      Map<string, Id<"occasions">>
    >();
    for (const [personName, occasions] of Object.entries(SEED_OCCASIONS)) {
      const personId = personIdByName.get(personName);
      if (!personId) continue;
      const byTitle = new Map<string, Id<"occasions">>();
      for (const occ of occasions) {
        // Conditional spread: omit absent fields entirely so Convex
        // stores them as missing, not as `undefined`.
        const id = await ctx.db.insert("occasions", {
          personId,
          title: occ.title,
          ...(occ.date !== undefined ? { date: occ.date } : {}),
          ...(occ.recurrence !== undefined
            ? { recurrence: occ.recurrence }
            : {}),
        });
        byTitle.set(occ.title, id);
        occasionsCount += 1;
      }
      occasionIdByPersonAndTitle.set(personName, byTitle);
    }
```

**Sub-edit 4b: Update the gift-ideas resolution**

Find the existing resolution block (uses `seed.givenForOccasionType` against `occasionIdByPersonAndType`):

```ts
      const givenForOccasionId =
        seed.givenToPersonName && seed.givenForOccasionType
          ? occasionIdByPersonAndType
              .get(seed.givenToPersonName)
              ?.get(seed.givenForOccasionType)
          : undefined;
```

Replace with:

```ts
      const givenForOccasionId =
        seed.givenToPersonName && seed.givenForOccasionTitle
          ? occasionIdByPersonAndTitle
              .get(seed.givenToPersonName)
              ?.get(seed.givenForOccasionTitle)
          : undefined;
```

- [ ] **Open `convex/seed.ts`**
- [ ] **Apply sub-edit 4a (occasions insert loop)**
- [ ] **Apply sub-edit 4b (gift-ideas resolution)**

### Step 5: Edit `convex/people.ts` (listWithNextOccasion)

Find the existing `return { ...person, nextOccasion, nextOccasionDate, ideaCount };` block inside the `enriched` array's map callback. Add `occasionCount`:

```ts
        return {
          ...person,
          nextOccasion,
          nextOccasionDate,
          ideaCount,
          occasionCount: occasions.length,
        };
```

`occasions.length` here refers to the variable already defined a few lines above — the result of `ctx.db.query("occasions").withIndex("by_person", ...).take(100)` for that person. No new query needed.

- [ ] **Open `convex/people.ts`**
- [ ] **Add `occasionCount: occasions.length` to the return object inside the `Promise.all(people.map(...))` callback**

### Step 6: Edit `src/lib/format.ts`

Replace the entire file body with:

```ts
// Display-side formatters for occasions, dates, and prices. Server
// returns raw timestamps + occasion titles + numeric amounts; this
// module turns those into the strings that show up on rows, chips,
// and cards.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
  if (days <= 0) return `${opts.title} · today`;
  if (days === 1) return `${opts.title} · tomorrow`;
  if (days <= 14) return `${opts.title} · in ${days} days`;
  const date = new Date(opts.nextDate);
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${opts.title} · ${month} ${date.getUTCDate()}`;
}

// "Annual · May 15" / "Once · Jun 12" / "Date TBD". For the
// Occasions section on the Profile screen.
export function formatOccasionLine(opts: {
  recurrence?: "yearly" | "one_off";
  date?: number;
}): string {
  if (opts.date == null) return "Date TBD";
  const date = new Date(opts.date);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getUTCDate();
  const recurrence = opts.recurrence ?? "one_off";
  const prefix = recurrence === "yearly" ? "Annual" : "Once";
  return `${prefix} · ${month} ${day}`;
}

// "today" / "tomorrow" / "in 5 days" / "in 3 weeks" / "in 4 months".
// No occasion-title prefix — the caller already shows the title
// alongside, so this is just the relative countdown.
export function formatRelativeDays(
  nextDate: number,
  now: number = Date.now(),
): string {
  const days = Math.ceil((nextDate - now) / ONE_DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 14) return `in ${days} days`;
  if (days <= 60) return `in ${Math.round(days / 7)} weeks`;
  if (days <= 365) return `in ${Math.round(days / 30)} months`;
  return "in over a year";
}

// "$129" for USD, "USD 129" for unknown symbols, "129" if no currency.
// Whole numbers only — gift price estimates are inherently approximate.
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
```

Changes from before: `occasionTypeName` and `TYPE_NAMES` deleted. `formatDateLine` accepts `title` instead of `occasionType` + `customLabel`. `formatOccasionLine` handles missing date by returning `"Date TBD"`. `formatRelativeDays` and `formatPrice` unchanged.

- [ ] **Open `src/lib/format.ts`**
- [ ] **Replace the file content with the code above**

### Step 7: Edit `src/app/(tabs)/index.tsx` (People list)

Two changes in this file: the `dateLineFor` function and the `formatDateLine` import call site.

**Sub-edit 7a: Replace `dateLineFor`**

Find the existing function:

```ts
function dateLineFor(person: EnrichedPerson): string {
  if (person.nextOccasion === null || person.nextOccasionDate === null) {
    return "No upcoming occasions";
  }
  return formatDateLine({
    occasionType: person.nextOccasion.type,
    customLabel: person.nextOccasion.customLabel,
    nextDate: person.nextOccasionDate,
  });
}
```

Replace with:

```ts
function dateLineFor(person: EnrichedPerson): string {
  if (person.nextOccasion !== null && person.nextOccasionDate !== null) {
    return formatDateLine({
      title: person.nextOccasion.title,
      nextDate: person.nextOccasionDate,
    });
  }
  if (person.occasionCount > 0) {
    // Person has occasions but none are dated yet — surface that
    // intent so the row doesn't look like a blank "no relationship
    // events" state.
    return "Pending date";
  }
  return "No upcoming occasions";
}
```

The `EnrichedPerson` type is derived from the query return shape via `useQuery`, so it automatically picks up the new `occasionCount` field added in Step 5 — no manual type declaration to update.

- [ ] **Open `src/app/(tabs)/index.tsx`**
- [ ] **Replace `dateLineFor` with the new version**

### Step 8: Edit `src/app/people/[id].tsx` (Profile screen)

The Profile screen renders occasions using `occasionTypeName(occ.type, occ.customLabel)` for the title and `formatOccasionLine({ recurrence, date })` for the meta. Update the title rendering and the import.

**Sub-edit 8a: Update the import**

Find:

```ts
import {
  formatOccasionLine,
  formatPrice,
  formatRelativeDays,
  occasionTypeName,
} from "@/lib/format";
```

Replace with (drop `occasionTypeName`):

```ts
import {
  formatOccasionLine,
  formatPrice,
  formatRelativeDays,
} from "@/lib/format";
```

**Sub-edit 8b: Update occasion-title rendering inside the `occasions.map` block**

Find:

```tsx
                    <View style={styles.occasionLeft}>
                      <Text style={styles.occasionTitle}>
                        {occasionTypeName(occ.type, occ.customLabel)}
                      </Text>
                      {isNext && occ.nextDate !== null && (
                        <Text style={styles.occasionNextHint}>
                          {formatRelativeDays(occ.nextDate)}
                        </Text>
                      )}
                    </View>
```

Replace with:

```tsx
                    <View style={styles.occasionLeft}>
                      <Text style={styles.occasionTitle}>{occ.title}</Text>
                      {isNext && occ.nextDate !== null && (
                        <Text style={styles.occasionNextHint}>
                          {formatRelativeDays(occ.nextDate)}
                        </Text>
                      )}
                    </View>
```

The `formatOccasionLine` call below it (rendering the right-column meta) doesn't change — it already accepts `recurrence: occ.recurrence, date: occ.date` and the function now returns `"Date TBD"` when date is missing. ✓

The `isNext` logic — `idx === 0 && occ.nextDate !== null` — also doesn't need changes. `nextDate` is `null` for dateless rows because `getNextOccurrence` early-returns null when `date` is missing, so dateless rows are correctly excluded from brass emphasis.

- [ ] **Open `src/app/people/[id].tsx`**
- [ ] **Apply sub-edit 8a (drop `occasionTypeName` from imports)**
- [ ] **Apply sub-edit 8b (replace `occasionTypeName(...)` call with `occ.title`)**

### Step 9: Verify TypeScript compiles cleanly

- [ ] **Run:** `npx tsc --noEmit`
- [ ] **Expected:** no output, exit code 0.

If errors appear, they'll be in the files just edited; re-read them against the spec and the steps above. Common gotchas: a leftover reference to `occ.type` or `occ.customLabel`, a stale import, or `occasionTypeName` still referenced somewhere.

### Step 10: Verify lint passes

- [ ] **Run:** `npm run lint`
- [ ] **Expected:** no lint errors, just the env-load lines.

### Step 11: Verify the iOS bundle builds

- [ ] **Run:** `npx expo export --platform ios --output-dir /tmp/gift-tracker-bundle-test`
- [ ] **Expected:** `Exported: /tmp/gift-tracker-bundle-test` and a `_expo/static/js/ios/entry-*.hbc` artifact (~3MB).
- [ ] **Cleanup:** `rm -rf /tmp/gift-tracker-bundle-test`

(No commit at end of Task 2 — we re-seed and smoke-test in Task 3 first.)

---

## Task 3: Re-seed and verify end-to-end, then commit

### Step 1: Re-seed against the cloud Convex deployment

`npx convex dev` should already be picking up the schema/code changes; if it's not running, start it in another terminal first.

- [ ] **Run:** `npx convex run seed:seedDevData`
- [ ] **Expected output:** `{"giftIdeasCount": 12, "occasionsCount": 12, "peopleCount": 5}`

If it errors with a schema validation message, return to Task 1 and verify the dashboard occasions table is empty, then retry.

### Step 2: Smoke-test the People list query

- [ ] **Run:** `npx convex run people:listWithNextOccasion`
- [ ] **Expected:** JSON array with 5 people. Each entry has the new `occasionCount: number` field. Priya's `occasionCount` is 2.
- [ ] **Spot check:** Priya's `nextOccasionDate` is the ms-timestamp for Oct 18 of the upcoming year (her next Birthday) — NOT null, even though her Housewarming is dateless, because Birthday provides a non-null candidate.

### Step 3: Smoke-test Priya's profile

- [ ] **Get Priya's id:**

```bash
npx convex run people:list | python3 -c "import sys, json; print(next(p['_id'] for p in json.load(sys.stdin) if p['name'] == 'Priya'))"
```

- [ ] **Run:** `npx convex run people:getProfile "{\"personId\":\"<Priya-id-from-above>\"}"`
- [ ] **Expected:** the response's `occasions` array has two entries — `{ title: "Birthday", date: <ms>, recurrence: "yearly", nextDate: <ms> }` and `{ title: "Housewarming", nextDate: null }` (with no `date` and no `recurrence` fields). Birthday is sorted first.

### Step 4: Simulator walkthrough

You'll need the iOS simulator running with the app. If not:
```bash
npx expo start --ios --port 8082
```

- [ ] **People tab — Priya's row** sorts by her Birthday's next occurrence; the date line reads `"Birthday · Oct 18"` (or "Birthday · in N days" if within 14 days of today).
- [ ] **Tap into Priya's profile.** Occasions list shows two rows:
  - **Birthday** at top with brass emphasis (subtle tint background + 2px brass left edge + brass `"in N days"` line below the title) and right-column meta `"Annual · Oct 18"`.
  - **Housewarming** below, no brass emphasis, right-column meta reads `"Date TBD"`.
- [ ] **Other profiles unchanged.** Spot-check Sarah (3 occasions, all dated; Mother's Day or Birthday gets brass top-row depending on today's date) and Tom (2 occasions, Birthday + Christmas).

### Step 5: Commit

- [ ] **Stage the 8 modified files:**

```bash
git add convex/schema.ts \
        convex/lib/dates.ts \
        convex/lib/seedData.ts \
        convex/seed.ts \
        convex/people.ts \
        src/lib/format.ts \
        "src/app/(tabs)/index.tsx" \
        "src/app/people/[id].tsx"
```

- [ ] **Verify staged scope:**

```bash
git status --short
```

Expected output: 8 lines starting with `M ` for the files above (plus the `convex/_generated/api.d.ts` regeneration which Convex codegen produces — stage that too if present). Nothing else should be staged. `docs/superpowers/plans/` stays untracked (consistent with previous commits).

If `convex/_generated/api.d.ts` is shown as modified:

```bash
git add convex/_generated/api.d.ts
```

- [ ] **Commit:**

```bash
git commit -m "$(cat <<'EOF'
Replace typed occasions with free-text title and optional date

Per spec docs/superpowers/specs/2026-04-27-occasion-typing-design.md:
drop the type enum and customLabel from occasions; add a free-text
title; make date and recurrence optional so users can record gift
intent before a date is known. Adds occasionCount to the People list
query so the date line can distinguish "all occasions are dateless"
from "no occasions yet". Profile and People screens render dateless
occasions as "Date TBD" / "Pending date" without brass emphasis.

Migration: cleared the 12 cloud-deployment occasion rows manually,
deployed the new schema, and re-seeded with the new shape (Priya's
Housewarming is now dateless to provide test coverage).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Verify commit succeeded:** `git log --oneline -1` shows the new commit.

---

## Self-Review Notes

**Spec coverage check** — every spec section has a task or step:

| Spec section | Where in plan |
|---|---|
| Schema delta | Task 2 Step 1 |
| Four logical states | Implicit in `getNextOccurrence` (Task 2 Step 2) |
| `getNextOccurrence` null handling | Task 2 Step 2 |
| `listWithNextOccasion` adds `occasionCount` | Task 2 Step 5 |
| `formatDateLine`/`formatOccasionLine`/`occasionTypeName` deletion | Task 2 Step 6 |
| Profile screen updates | Task 2 Step 8 |
| People list updates (`Pending date` vs empty) | Task 2 Step 7 |
| Seed shape change + Priya dateless | Task 2 Steps 3–4 |
| Migration (wipe + re-seed) | Task 1 + Task 3 Step 1 |
| Verification commands | Task 3 Steps 1–4 |

**Type consistency check** — names match across steps:
- `OccasionSeed.title` (introduced Step 3a, used Step 4a) ✓
- `GiftIdeaSeed.givenForOccasionTitle` (introduced Step 3a, used Step 4b, populated Step 3c) ✓
- `occasionIdByPersonAndTitle` (introduced Step 4a, used Step 4b) ✓
- `occasionCount` (introduced Step 5, used Step 7a) ✓
- `formatDateLine({ title, nextDate })` (defined Step 6, called Step 7a) ✓

**Placeholder scan** — none.

**Scope check** — single coherent change, single commit at the end. Appropriate scope.
