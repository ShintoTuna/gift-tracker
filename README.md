# Gift Tracker

Mobile app for capturing gift ideas and surfacing them around upcoming occasions. See [`docs/PRD.md`](docs/PRD.md) for the full product spec, and [`design/`](design/) for screen mockups and the Midnight Garden design system.

## Stack

- **Mobile**: Expo SDK 55, React Native, TypeScript, Expo Router (file-based)
- **Backend**: Convex — schemas + queries + real-time sync
- **Auth**: not yet wired (stubbed via `DEV_USER_ID` in `src/lib/devAuth.ts`)

## Local development

Two terminals:

```sh
# Terminal 1 — Convex dev backend (also writes EXPO_PUBLIC_CONVEX_URL to .env.local)
npx convex dev

# Terminal 2 — Metro + iOS simulator
npx expo start --ios
```

The Convex CLI currently runs **anonymously on localhost** (`http://127.0.0.1:3210`). The data lives only on this machine — no cloud, no dashboard at convex.dev. That's fine for solo iteration; switch to cloud (below) when you need cross-device testing, dashboard visibility, or to share progress.

## Switching to a cloud-backed Convex deployment

When you want the project to appear at https://dashboard.convex.dev — required for: testing on a physical device, sharing progress, eventual production deploy:

```sh
# 1. Stop any running `npx convex dev` (Ctrl-C in its terminal)

# 2. Wipe the anonymous config so the CLI re-prompts on first run
rm .env.local

# 3. Authenticate via browser (GitHub OAuth)
npx convex login

# 4. Re-initialize — the CLI will prompt you to create a cloud project named "gift-tracker"
npx convex dev
```

Step 4 rewrites `.env.local` with a `dev:<project>` deployment ID and a `https://<project>.convex.cloud` URL, then pushes the schema + indexes to the cloud. The project will show up in the dashboard.

Restart Metro (`npx expo start --ios`) after `.env.local` changes — `EXPO_PUBLIC_*` vars are baked at bundle time.

When ready for TestFlight: `npx convex deploy --prod` creates a separate **production** deployment alongside dev.

## Project layout

```
gift-tracker/
├── convex/                    # Convex backend (schema, queries, mutations, actions)
│   ├── schema.ts              # users, people, occasions, giftIdeas
│   ├── people.ts              # queries/mutations for people
│   └── _generated/            # codegen — committed; refreshed by `npx convex dev`
├── src/
│   ├── app/                   # Expo Router routes (file-based)
│   │   ├── _layout.tsx        # ConvexProvider + Stack
│   │   ├── (tabs)/            # People, Calendar, Backlog
│   │   ├── people/[id].tsx    # Person profile
│   │   ├── capture.tsx        # Quick capture (modal)
│   │   └── brainstorm/[personId].tsx  # AI brainstorm (modal)
│   ├── components/            # Design system atoms
│   ├── lib/                   # Convex client, dev auth stub
│   └── theme/                 # tokens (Midnight Garden palette)
├── docs/                      # PRD and supporting docs
└── design/                    # HTML/JSX mockups (reference: v3/, design-system/)
```

## Design system

Midnight Garden v1.0 — dark canonical, brass-accented. Tokens live in `src/theme/tokens.ts`. The "brass rule": brass means *the next thing to do or look at* — primary CTA only, max two per screen, never decoration. See `design/v3/system-runtime.jsx` for the source of truth.
