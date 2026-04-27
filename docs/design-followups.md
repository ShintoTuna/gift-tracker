# Design follow-ups

Polish items spotted during implementation that don't block shipping
but should be revisited later. Items reference screens in `/design/`
(see `design/v3/screens.jsx` for the most recent reference).

## Quick Capture (Screen B) — revisit when adding photos + clipboard

The current implementation diverges from the design's `ScreenCapture`
in a few places. None of these break the flow, but the design's
visual identity is more distinctive and worth restoring:

- **Hero idea field** — design has the idea input as a large 28-px
  serif with no competing label or fields above it, brass-bottom
  border, blinking cursor. We currently render a standard `TextField`
  with a small mono `Label`. Let's switch back to the hero treatment
  when the screen gets its next visual pass.
- **Clipboard chip** — design has a `Card` that surfaces a detected
  URL from the OS clipboard with a brass "Attach" pill. We don't have
  clipboard detection wired at all yet. Adding it pairs naturally
  with the visual rework.
- **Inline "For" picker** — design renders selected `PersonChip`s
  and the live cursor in a single flex-wrap row, with the suggestion
  list immediately below. We separate selected chips above and
  search input below. Same UX, different feel.
- **Price + Occasion grid** — design has price and occasion-picker
  side-by-side in a 2-column grid below the optional fields. We have
  price as a single full-width input and no occasion picker yet.

Trigger: when photo upload (Convex File Storage) and clipboard
detection land, do this layout rework in the same step rather than
piecemeal.
