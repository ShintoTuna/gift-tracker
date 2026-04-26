# Occasion typing simplification

Brainstormed and accepted 2026-04-27.

## Context

The current `occasions` schema models five hardcoded types
(`birthday`, `christmas`, `anniversary`, `mothers_day`, `custom`) plus
a `customLabel` string for the custom case, with a required `date` and
required `recurrence`. Two issues with this shape surfaced in design:

1. **The type enum is a leak of UI/AI affordances into the data
   layer.** Every place we'd use it (AI suggestions, notification
   copy, calendar grouping) can read the title field instead. The
   type doesn't change how rows are queried, sorted, or stored.
   Auto-fill at capture and pluralization in the UI are better
   handled by fuzzy title matching at the UI layer than by enforcing
   an enum in the database.

2. **The required `date` excludes a real use case.** A user knows a
   gift moment is coming for a person but doesn't yet know when —
   e.g., a friend bought a house and will eventually have a
   housewarming party. The user wants to record gift intent now.

This change collapses the typed occasion model into a free-text title
with optional date and recurrence, and is the prerequisite for the
calendar/agenda screens that come next.

## Schema

```ts
occasions: defineTable({
  personId: v.id("people"),
  title: v.string(),
  date: v.optional(v.number()),
  recurrence: v.optional(v.union(
    v.literal("yearly"),
    v.literal("one_off"),
  )),
})
```

Removed: `type`, `customLabel`. Indexes unchanged: `by_person` on
`["personId"]`, `by_date` on `["date"]`. Convex handles null values
in indexes (rows with null sort to one end).

## Four logical states

| `date`  | `recurrence` | Meaning                                  |
| ------- | ------------ | ---------------------------------------- |
| set     | `yearly`     | Recurring annual occasion (birthday)     |
| set     | `one_off`    | Specific upcoming event with known date  |
| set     | absent       | Treated as `one_off` (lenient default)   |
| absent  | (any)        | TBD — gift moment exists, date not known |

We don't enforce cross-field validation (e.g., "yearly without date
is invalid"). The UI will hide the recurrence picker when no date is
set, so the bad combinations are hard to enter; if a row ends up in a
nonsense state, queries treat it as `one_off` and code keeps working.

## Behavior changes

### `convex/lib/dates.ts` — `getNextOccurrence`

- Early-return `null` when `occasion.date == null`.
- Treat absent `recurrence` as `one_off`.
- All other logic unchanged.

### `convex/people.ts`

- `listWithNextOccasion` and `getProfile` return raw occasion rows
  with the new shape. Sorting (upcoming first, dateless/past
  one-offs last) already works because they all yield `nextDate ===
  null`.
- **Add `occasionCount: number`** to each enriched person in
  `listWithNextOccasion` so the People list date line can
  distinguish "no occasions at all" from "all occasions are
  dateless." Cheap to compute — the query already collects each
  person's occasions to compute `nextOccasionDate`.

### `src/lib/format.ts`

- Delete `occasionTypeName` (no longer needed).
- `formatDateLine` accepts `title: string` directly instead of
  `occasionType + customLabel`.
- `formatOccasionLine` accepts `recurrence?: "yearly" | "one_off"`
  and `date?: number`. Returns `"Date TBD"` when date is null;
  otherwise returns `"Annual · May 10"` or `"Once · Jun 12"` as today.

### `src/app/people/[id].tsx` — Profile screen

- Replace `occasionTypeName(occ.type, occ.customLabel)` with
  `occ.title` everywhere.
- Brass "next" emphasis (background tint + left border + brass "in
  N days" text) triggers only when `occ.date != null && occ.nextDate
  != null`. A profile with only dateless occasions = no brass row.
- Dateless rows render their right-column meta as `"Date TBD"` in
  `text3` instead of `"Annual · May 10"`.

### `src/app/(tabs)/index.tsx` — People list

- Replace `formatDateLine({ occasionType, customLabel, ... })` with
  `formatDateLine({ title, ... })`.
- Date line:
  - `nextOccasionDate` set → existing `"Title · in N days"` /
    `"Title · May 15"` formatting.
  - `nextOccasionDate == null` AND `occasionCount > 0` →
    `"Pending date"` (dateless-only state).
  - `nextOccasionDate == null` AND `occasionCount == 0` →
    `"No upcoming occasions"` (existing empty state).

## Seed data

`convex/lib/seedData.ts`:

- `OccasionSeed` becomes `{ title: string; date?: number; recurrence?: "yearly" | "one_off" }`.
- Mapping from current data:
  - `type: "birthday"` → `title: "Birthday"`
  - `type: "christmas"` → `title: "Christmas"`
  - `type: "anniversary"` → `title: "Anniversary"`
  - `type: "mothers_day"` → `title: "Mother's Day"`
  - `type: "custom", customLabel: "Housewarming"` → `title: "Housewarming"`
- **Modify Priya's "Housewarming" entry to drop the `date` field**,
  giving us mixed-state coverage (Priya keeps her dated Birthday
  plus a dateless "Housewarming"). The all-dateless people-list
  state is functionally equivalent and well-covered by code review;
  testing it end-to-end can wait until the create-person form lands.

`convex/seed.ts`:

- Insert call uses `title` instead of `type`/`customLabel`.
- Conditionally include `date` in the insert object — omit the field
  entirely when `seed.date` is undefined so Convex stores it absent
  rather than as `undefined`.

## Migration

Wipe + re-seed via the DevDock "Seed dev data" button.
Justification:

- 12 seeded occasion rows in a dev cloud deployment, no production
  users.
- Schema change drops `type` and `customLabel` (rows would fail
  validation post-deploy) and adds required `title` (rows would lack
  it).
- Convex's online migration tooling is overkill at this volume.
- Procedure: deploy schema → tap "Seed dev data" → confirm new shape.
  The seed mutation's wipe phase removes the offending rows before
  the schema validator can reject them.

## Out of scope

- **Recurrence richness** (e.g., "2nd Sunday of May" for Mother's
  Day, computed Easter). Keep `yearly | one_off` for now; revisit
  when notification scheduling demands accurate floating dates.
- **Calendar grouping by date** (multiple Christmas rows on Dec 25).
  Lands with the Calendar screen — purely a presentation concern.
- **Capture form UX** for the create-occasion flow. The form will
  surface date as optional with a "TBD" affordance and hide the
  recurrence picker when date is empty. Belongs in the create-form
  step.
- **Cross-person occasion rows** ("one Christmas row tagged to many
  people"). Brainstorm explicitly rejected this — gift planning is
  fundamentally per-(person, date), and the calendar UI handles
  visual grouping.

## Verification

1. `npx tsc --noEmit` clean
2. `npm run lint` clean
3. `npx expo export --platform ios` bundles cleanly
4. `npx convex run seed:seedDevData` returns expected counts;
   inspecting an occasion row in the Convex dashboard shows
   `title` field, no `type`/`customLabel`
5. `npx convex run people:getProfile` against Priya's id returns
   her two occasions, one with `date` set (Birthday) and one
   without (Housewarming)
6. iOS simulator walkthrough:
   - People list — Priya's row sorts by her Birthday's next
     occurrence (Oct 18); date line renders the title + "Birthday ·
     in 174 days" or similar
   - Tap into Priya's profile — Occasions list shows two rows,
     Birthday with brass "next" emphasis at the top and Housewarming
     with `"Date TBD"` in the right column (no brass)
   - All other people unchanged in look and behavior

## Critical files

- `/Users/ns/projects/gift-tracker/convex/schema.ts`
- `/Users/ns/projects/gift-tracker/convex/lib/dates.ts`
- `/Users/ns/projects/gift-tracker/convex/lib/seedData.ts`
- `/Users/ns/projects/gift-tracker/convex/seed.ts`
- `/Users/ns/projects/gift-tracker/convex/people.ts`
- `/Users/ns/projects/gift-tracker/src/lib/format.ts`
- `/Users/ns/projects/gift-tracker/src/app/(tabs)/index.tsx`
- `/Users/ns/projects/gift-tracker/src/app/people/[id].tsx`
