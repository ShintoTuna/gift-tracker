# Gift Tracker MVP — Scaffold & Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Expo app scaffold, configure Convex backend, establish data schemas, and wire Expo Router navigation so the next phase (UI implementation) has a stable foundation.

**Architecture:** 
This phase is foundational-only: no UI screens beyond blank templates, no business logic, just the plumbing. We start with Expo + TypeScript, add Convex for backend + real-time queries, wire Expo Router for navigation structure, and implement minimal auth (Convex Auth via email/password). Database schemas match the PRD exactly. By the end, the app boots to a tab-based shell with auth gating, ready for screens.

**Tech Stack:**
- Expo 52 + React Native
- TypeScript throughout
- Expo Router (file-based routing)
- Convex (backend, schemas, queries, mutations)
- Convex Auth (email/password, no social for MVP)

---

## Phase 1: Project Scaffolding

### Task 1: Create Expo project with TypeScript

**Files:**
- Create: `app/` directory structure (Expo Router convention)
- Create: `tsconfig.json`
- Create: `package.json` (dependency list)
- Create: `app.json` (Expo config)
- Modify: Root files for TypeScript support

- [ ] **Step 1: Initialize Expo project**

Run:
```bash
npx create-expo-app@latest gift-tracker --template
```

- [ ] **Step 2: Choose TypeScript option and confirm**

Expected: Expo scaffold with TypeScript support created.

- [ ] **Step 3: Create folder structure**

```bash
mkdir -p app/{screens,components,lib,hooks}
```

- [ ] **Step 4: Update app.json for iOS + Expo Router**

```json
{
  "expo": {
    "name": "Gift Tracker",
    "slug": "gift-tracker",
    "version": "0.1.0",
    "scheme": "gifttrackerapp",
    "platforms": ["ios"],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.monochrome.gifttrackerapp"
    },
    "plugins": [
      "expo-router"
    ],
    "web": {
      "bundler": "metro"
    }
  }
}
```

- [ ] **Step 5: Install Expo Router**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens
```

- [ ] **Step 6: Verify project boots**

Run:
```bash
npm start
```

Expected: Expo dev server starts successfully.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "scaffold: initialize Expo app with TypeScript and Expo Router"
```

---

### Task 2: Set up Convex project and dependencies

**Files:**
- Create: `convex/` directory (Convex functions)
- Create: `convex.json` (Convex config)
- Create: `.env.local` (Convex API key, gitignored)
- Modify: `package.json` (add convex, convex-helpers)

- [ ] **Step 1: Initialize Convex in the project**

```bash
npx convex init
```

Follow the prompts to create a Convex account and project (if not already done).

- [ ] **Step 2: Verify Convex installed and convex.json created**

Expected: `convex/` folder exists, `convex.json` at root, `.env.local` contains CONVEX_DEPLOYMENT.

- [ ] **Step 3: Create convex directory structure**

```bash
mkdir -p convex/lib
```

- [ ] **Step 4: Update package.json Convex versions**

Verify versions installed are:
- `convex`: >=1.13.0
- `convex-helpers`: >=1.1.0

```bash
npm list convex
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "scaffold: initialize Convex backend project"
```

---

## Phase 2: Data Schemas

### Task 3: Define Convex schema file with all entities

**Files:**
- Create: `convex/schema.ts`

- [ ] **Step 1: Create schema.ts with User table**

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    displayName: v.string(),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("plus"),
      v.literal("pro")
    ),
    aiUsageThisPeriod: v.number(),
    acceptedTermsVersion: v.string(),
    acceptedTermsAt: v.number(), // timestamp in ms
    createdAt: v.number(), // timestamp in ms
  })
    .index("by_email", ["email"]),
});
```

- [ ] **Step 2: Add Person table to schema**

```typescript
// In export default defineSchema, add:
  people: defineTable({
    userId: v.id("users"),
    name: v.string(),
    nickname: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    relationship: v.optional(v.string()), // mom, friend, partner, colleague, etc.
    interests: v.array(v.string()),
    notes: v.string(), // free-form text; encrypted in v0.3
    dateMet: v.optional(v.number()), // timestamp in ms
    dateOfBirth: v.optional(v.number()), // timestamp in ms
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),
```

- [ ] **Step 3: Add Occasion table to schema**

```typescript
// In export default defineSchema, add:
  occasions: defineTable({
    personId: v.id("people"),
    type: v.union(
      v.literal("birthday"),
      v.literal("christmas"),
      v.literal("anniversary"),
      v.literal("mothers_day"),
      v.literal("fathers_day"),
      v.literal("custom")
    ),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    recurrence: v.union(v.literal("yearly"), v.literal("one-off")),
    customLabel: v.optional(v.string()), // for non-standard occasions
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_personId", ["personId"]),
```

- [ ] **Step 4: Add GiftIdea table to schema**

```typescript
// In export default defineSchema, add:
  giftIdeas: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    priceEstimate: v.optional(v.number()), // in cents
    currency: v.optional(v.string()), // default "USD"
    taggedPeople: v.array(v.id("people")), // many-to-many: person IDs
    status: v.union(
      v.literal("idea"),
      v.literal("planned"),
      v.literal("purchased"),
      v.literal("given")
    ),
    givenTo: v.optional(v.id("people")),
    givenAt: v.optional(v.number()), // timestamp in ms
    givenForOccasionId: v.optional(v.id("occasions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
```

- [ ] **Step 5: Add ThirdPartyDeletionRequest table to schema**

```typescript
// In export default defineSchema, add:
  thirdPartyDeletionRequests: defineTable({
    requesterEmail: v.string(),
    claimedPersonName: v.string(),
    requestedAt: v.number(), // timestamp in ms
    status: v.union(
      v.literal("pending"),
      v.literal("resolved"),
      v.literal("denied")
    ),
    resolvedBy: v.optional(v.string()), // admin email
    resolvedAt: v.optional(v.number()), // timestamp in ms
    notes: v.optional(v.string()),
  })
    .index("by_status", ["status"]),
```

- [ ] **Step 6: Verify schema compiles**

Run:
```bash
npx convex dev --once
```

Expected: No schema validation errors.

- [ ] **Step 7: Commit**

```bash
git add convex/schema.ts
git commit -m "schema: define User, Person, Occasion, GiftIdea, ThirdPartyDeletionRequest tables"
```

---

### Task 4: Create Convex auth configuration

**Files:**
- Create: `convex/auth.config.js`

- [ ] **Step 1: Create auth.config.js**

```javascript
const { defineAuth } = require("convex/server");
const { getAuthConfig } = require("@convex-dev/auth/server");

module.exports = defineAuth(getAuthConfig());
```

- [ ] **Step 2: Install Convex Auth package**

```bash
npm install convex-helpers
npx convex install convex-helpers
```

- [ ] **Step 3: Verify auth config created**

Expected: `convex/auth.config.js` file exists.

- [ ] **Step 4: Commit**

```bash
git add convex/auth.config.js
git commit -m "auth: configure Convex Auth with email/password provider"
```

---

## Phase 3: Convex Queries & Mutations (Skeleton)

### Task 5: Create User queries and mutations

**Files:**
- Create: `convex/users.ts`

- [ ] **Step 1: Create users.ts with getCurrentUser query**

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
```

- [ ] **Step 2: Add createUser mutation**

```typescript
// In users.ts, add:
export const createUser = mutation({
  args: {
    email: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    
    if (existingUser) {
      throw new Error("User already exists");
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      email: args.email,
      displayName: args.displayName,
      subscriptionTier: "free",
      aiUsageThisPeriod: 0,
      acceptedTermsVersion: "1.0",
      acceptedTermsAt: now,
      createdAt: now,
    });
  },
});
```

- [ ] **Step 3: Add updateUser mutation**

```typescript
// In users.ts, add:
export const updateUser = mutation({
  args: {
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    return await ctx.db.patch(userId, {
      displayName: args.displayName ?? user.displayName,
      updatedAt: Date.now(),
    });
  },
});
```

- [ ] **Step 4: Verify queries compile**

Run:
```bash
npx convex dev --once
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add convex/users.ts
git commit -m "api: add User queries (getCurrentUser) and mutations (createUser, updateUser)"
```

---

### Task 6: Create People queries and mutations skeleton

**Files:**
- Create: `convex/people.ts`

- [ ] **Step 1: Create people.ts with list query**

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listPeople = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("people")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.personId);
  },
});
```

- [ ] **Step 2: Add createPerson mutation**

```typescript
// In people.ts, add:
export const createPerson = mutation({
  args: {
    name: v.string(),
    nickname: v.optional(v.string()),
    relationship: v.optional(v.string()),
    interests: v.array(v.string()),
    notes: v.string(),
    dateOfBirth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("people", {
      userId,
      name: args.name,
      nickname: args.nickname,
      relationship: args.relationship,
      interests: args.interests,
      notes: args.notes,
      dateOfBirth: args.dateOfBirth,
      photoUrl: undefined,
      dateMet: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

- [ ] **Step 3: Add updatePerson mutation**

```typescript
// In people.ts, add:
export const updatePerson = mutation({
  args: {
    personId: v.id("people"),
    name: v.optional(v.string()),
    nickname: v.optional(v.string()),
    relationship: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const person = await ctx.db.get(args.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Not authorized");
    }

    return await ctx.db.patch(args.personId, {
      name: args.name ?? person.name,
      nickname: args.nickname ?? person.nickname,
      relationship: args.relationship ?? person.relationship,
      interests: args.interests ?? person.interests,
      notes: args.notes ?? person.notes,
      updatedAt: Date.now(),
    });
  },
});
```

- [ ] **Step 4: Verify**

Run:
```bash
npx convex dev --once
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add convex/people.ts
git commit -m "api: add People queries (listPeople, getPerson) and mutations (createPerson, updatePerson)"
```

---

### Task 7: Create GiftIdea queries and mutations skeleton

**Files:**
- Create: `convex/giftIdeas.ts`

- [ ] **Step 1: Create giftIdeas.ts with list query**

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listGiftIdeas = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("giftIdeas")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getGiftIdea = query({
  args: { ideaId: v.id("giftIdeas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ideaId);
  },
});

export const getIdeasForPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const ideas = await ctx.db
      .query("giftIdeas")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return ideas.filter((idea) =>
      idea.taggedPeople.includes(args.personId)
    );
  },
});
```

- [ ] **Step 2: Add createGiftIdea mutation**

```typescript
// In giftIdeas.ts, add:
export const createGiftIdea = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    taggedPeople: v.array(v.id("people")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("giftIdeas", {
      userId,
      title: args.title,
      description: args.description,
      imageUrl: args.imageUrl,
      sourceUrl: args.sourceUrl,
      priceEstimate: args.priceEstimate,
      currency: "USD",
      taggedPeople: args.taggedPeople,
      status: "idea",
      givenTo: undefined,
      givenAt: undefined,
      givenForOccasionId: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

- [ ] **Step 3: Add updateGiftIdea mutation**

```typescript
// In giftIdeas.ts, add:
export const updateGiftIdea = mutation({
  args: {
    ideaId: v.id("giftIdeas"),
    title: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("idea"),
        v.literal("planned"),
        v.literal("purchased"),
        v.literal("given")
      )
    ),
    givenTo: v.optional(v.id("people")),
    givenForOccasionId: v.optional(v.id("occasions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== userId) {
      throw new Error("Not authorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.status !== undefined) updates.status = args.status;
    if (args.givenTo !== undefined) updates.givenTo = args.givenTo;
    if (args.givenForOccasionId !== undefined) {
      updates.givenForOccasionId = args.givenForOccasionId;
    }

    return await ctx.db.patch(args.ideaId, updates);
  },
});
```

- [ ] **Step 4: Verify**

Run:
```bash
npx convex dev --once
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add convex/giftIdeas.ts
git commit -m "api: add GiftIdea queries (listGiftIdeas, getIdeasForPerson) and mutations (createGiftIdea, updateGiftIdea)"
```

---

### Task 8: Create Occasion queries and mutations skeleton

**Files:**
- Create: `convex/occasions.ts`

- [ ] **Step 1: Create occasions.ts**

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getOccasionsForPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("occasions")
      .withIndex("by_personId", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const getOccasion = query({
  args: { occasionId: v.id("occasions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.occasionId);
  },
});
```

- [ ] **Step 2: Add createOccasion mutation**

```typescript
// In occasions.ts, add:
export const createOccasion = mutation({
  args: {
    personId: v.id("people"),
    type: v.union(
      v.literal("birthday"),
      v.literal("christmas"),
      v.literal("anniversary"),
      v.literal("mothers_day"),
      v.literal("fathers_day"),
      v.literal("custom")
    ),
    date: v.string(), // YYYY-MM-DD
    recurrence: v.union(v.literal("yearly"), v.literal("one-off")),
    customLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const person = await ctx.db.get(args.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Not authorized");
    }

    const now = Date.now();
    return await ctx.db.insert("occasions", {
      personId: args.personId,
      type: args.type,
      date: args.date,
      recurrence: args.recurrence,
      customLabel: args.customLabel,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

- [ ] **Step 3: Add updateOccasion mutation**

```typescript
// In occasions.ts, add:
export const updateOccasion = mutation({
  args: {
    occasionId: v.id("occasions"),
    date: v.optional(v.string()),
    customLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const occasion = await ctx.db.get(args.occasionId);
    if (!occasion) throw new Error("Occasion not found");

    const person = await ctx.db.get(occasion.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Not authorized");
    }

    return await ctx.db.patch(args.occasionId, {
      date: args.date ?? occasion.date,
      customLabel: args.customLabel ?? occasion.customLabel,
      updatedAt: Date.now(),
    });
  },
});
```

- [ ] **Step 4: Verify**

Run:
```bash
npx convex dev --once
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add convex/occasions.ts
git commit -m "api: add Occasion queries and mutations (createOccasion, updateOccasion)"
```

---

## Phase 4: React Native Client Setup

### Task 9: Create Convex client and hooks

**Files:**
- Create: `app/lib/convex.ts`
- Create: `app/hooks/useAuth.ts`
- Create: `app/hooks/useConvexUser.ts`

- [ ] **Step 1: Create Convex client setup**

```typescript
// app/lib/convex.ts
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("EXPO_PUBLIC_CONVEX_URL env var not set");
}

export const convex = new ConvexReactClient(convexUrl);
```

- [ ] **Step 2: Set EXPO_PUBLIC_CONVEX_URL in .env.local**

Get your Convex deployment URL from `convex.json` or Convex dashboard:

```bash
echo "EXPO_PUBLIC_CONVEX_URL=$(cat convex.json | grep deploymentUrl)" >> .env.local
```

(Or manually add it to .env.local)

- [ ] **Step 3: Create useAuth hook**

```typescript
// app/hooks/useAuth.ts
import { useAuthActions, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useCallback } from "react";

export function useAuth() {
  const { signUp, signIn, signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUpUser = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await signUp({ email, password });
        // User created, now fetch/create user record
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign up failed");
      } finally {
        setIsLoading(false);
      }
    },
    [signUp]
  );

  const signInUser = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await signIn({ email, password });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign in failed");
      } finally {
        setIsLoading(false);
      }
    },
    [signIn]
  );

  const signOutUser = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
    }
  }, [signOut]);

  return {
    user,
    isLoading,
    error,
    signUp: signUpUser,
    signIn: signInUser,
    signOut: signOutUser,
  };
}
```

- [ ] **Step 4: Create useConvexUser hook for user data**

```typescript
// app/hooks/useConvexUser.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./useAuth";

export function useConvexUser() {
  const { user: authUser } = useAuth();
  const createUser = useMutation(api.users.createUser);

  const onCreateUser = async (email: string, displayName: string) => {
    if (!authUser) throw new Error("Not authenticated");
    return await createUser({ email, displayName });
  };

  return {
    authUser,
    createUser: onCreateUser,
  };
}
```

- [ ] **Step 5: Update package.json with Convex React client**

```bash
npm install convex
```

- [ ] **Step 6: Create convex/_generated/api.ts stub**

This file is auto-generated by Convex, but create a placeholder:

```typescript
// convex/_generated/api.ts
// This file is auto-generated by Convex; do not edit directly.
// It exports the type-safe API from all Convex functions.
export const api = {} as any;
```

(Will be replaced when you run `npx convex dev`)

- [ ] **Step 7: Commit**

```bash
git add app/lib/convex.ts app/hooks/useAuth.ts app/hooks/useConvexUser.ts .env.local
git commit -m "client: set up Convex client, auth hook, and user hook"
```

---

## Phase 5: Navigation Structure with Expo Router

### Task 10: Create Expo Router layout structure

**Files:**
- Create: `app/_layout.tsx` (root layout with auth guard)
- Create: `app/(auth)/_layout.tsx` (auth stack)
- Create: `app/(auth)/login.tsx` (placeholder)
- Create: `app/(auth)/signup.tsx` (placeholder)
- Create: `app/(tabs)/_layout.tsx` (tab-based main navigation)
- Create: `app/(tabs)/people.tsx` (People tab — placeholder)
- Create: `app/(tabs)/calendar.tsx` (Calendar tab — placeholder)
- Create: `app/(tabs)/backlog.tsx` (Backlog tab — placeholder)
- Create: `app/(tabs)/profile.tsx` (Profile tab — placeholder)

- [ ] **Step 1: Create root _layout.tsx**

```typescript
// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { useAuth } from "@/app/hooks/useAuth";
import { ActivityIndicator, View } from "react-native";
import { ConvexProvider } from "convex/react";
import { convex } from "@/app/lib/convex";

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#C8A45A" />
      </View>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <Stack.Screen
            name="(tabs)"
            options={{
              gestureEnabled: false,
            }}
          />
        ) : (
          <Stack.Screen
            name="(auth)"
            options={{
              gestureEnabled: false,
            }}
          />
        )}
      </Stack>
    </ConvexProvider>
  );
}
```

- [ ] **Step 2: Create (auth) layout**

```typescript
// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
```

- [ ] **Step 3: Create login.tsx placeholder**

```typescript
// app/(auth)/login.tsx
import { View, Text } from "react-native";

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>Login Screen (Coming Soon)</Text>
    </View>
  );
}
```

- [ ] **Step 4: Create signup.tsx placeholder**

```typescript
// app/(auth)/signup.tsx
import { View, Text } from "react-native";

export default function SignupScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>Signup Screen (Coming Soon)</Text>
    </View>
  );
}
```

- [ ] **Step 5: Create (tabs) layout**

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C8A45A",
        tabBarInactiveTintColor: "#8A9A8F",
        tabBarStyle: {
          backgroundColor: "#16241E",
          borderTopColor: "#213830",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="people"
        options={{
          title: "People",
          tabBarLabel: "People",
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarLabel: "Calendar",
        }}
      />
      <Tabs.Screen
        name="backlog"
        options={{
          title: "Backlog",
          tabBarLabel: "Backlog",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 6: Create people.tsx placeholder**

```typescript
// app/(tabs)/people.tsx
import { View, Text } from "react-native";

export default function PeopleScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>People Screen (Coming Soon)</Text>
    </View>
  );
}
```

- [ ] **Step 7: Create calendar.tsx placeholder**

```typescript
// app/(tabs)/calendar.tsx
import { View, Text } from "react-native";

export default function CalendarScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>Calendar Screen (Coming Soon)</Text>
    </View>
  );
}
```

- [ ] **Step 8: Create backlog.tsx placeholder**

```typescript
// app/(tabs)/backlog.tsx
import { View, Text } from "react-native";

export default function BacklogScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>Backlog Screen (Coming Soon)</Text>
    </View>
  );
}
```

- [ ] **Step 9: Create profile.tsx placeholder**

```typescript
// app/(tabs)/profile.tsx
import { View, Text } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>Profile Screen (Coming Soon)</Text>
    </View>
  );
}
```

- [ ] **Step 10: Install expo-router icons (optional)**

```bash
npm install @expo/vector-icons
```

- [ ] **Step 11: Test that app boots to auth or tabs layout**

Run:
```bash
npm start
```

Expected: App boots. If not authenticated, shows login placeholder. If authenticated (via Convex Auth), shows tabs with four screens.

- [ ] **Step 12: Commit**

```bash
git add app/
git commit -m "navigation: set up Expo Router with auth guard and four-tab main layout"
```

---

## Phase 6: Auth Flow Implementation

### Task 11: Implement login screen with Convex Auth

**Files:**
- Modify: `app/(auth)/login.tsx`

- [ ] **Step 1: Replace login.tsx with full implementation**

```typescript
// app/(auth)/login.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { Link } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1A16",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: "#E8E1CF",
    marginBottom: 8,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#A8B5A8",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    backgroundColor: "#16241E",
    borderColor: "#213830",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#E8E1CF",
    marginBottom: 12,
    fontSize: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#C8A45A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#0F1A16",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: "#A04545",
    fontSize: 13,
    marginBottom: 12,
  },
  signupLink: {
    marginTop: 20,
    flexDirection: "row",
  },
  signupText: {
    color: "#A8B5A8",
    fontSize: 14,
  },
  signupLinkText: {
    color: "#C8A45A",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading, error } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }
    await signIn(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gift Tracker</Text>
      <Text style={styles.subtitle}>Track gift ideas for the people you care about</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8A9A8F"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8A9A8F"
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#0F1A16" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.signupLink}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <Link href="/signup">
          <Text style={styles.signupLinkText}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Test login screen renders**

Run app and verify login screen shows.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/login.tsx
git commit -m "auth: implement login screen with email/password form"
```

---

### Task 12: Implement signup screen with Convex Auth

**Files:**
- Modify: `app/(auth)/signup.tsx`

- [ ] **Step 1: Replace signup.tsx with full implementation**

```typescript
// app/(auth)/signup.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { Link } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1A16",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: "#E8E1CF",
    marginBottom: 8,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#A8B5A8",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    backgroundColor: "#16241E",
    borderColor: "#213830",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#E8E1CF",
    marginBottom: 12,
    fontSize: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#C8A45A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#0F1A16",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: "#A04545",
    fontSize: 13,
    marginBottom: 12,
  },
  loginLink: {
    marginTop: 20,
    flexDirection: "row",
  },
  loginText: {
    color: "#A8B5A8",
    fontSize: 14,
  },
  loginLinkText: {
    color: "#C8A45A",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const { signUp, isLoading, error } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !displayName) {
      return;
    }
    await signUp(email, password, displayName);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gift Tracker</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#8A9A8F"
        value={displayName}
        onChangeText={setDisplayName}
        editable={!isLoading}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8A9A8F"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8A9A8F"
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#0F1A16" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginLink}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <Link href="/login">
          <Text style={styles.loginLinkText}>Sign in</Text>
        </Link>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Test signup screen renders and form works**

Run app, navigate to signup, verify form inputs work.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/signup.tsx
git commit -m "auth: implement signup screen with email/password/name form"
```

---

## Verification & Handoff

### Task 13: Verify scaffold boots end-to-end

**Files:**
- None

- [ ] **Step 1: Start Convex dev server**

```bash
npx convex dev
```

Expected: Convex functions compile, server running on `http://localhost:3210`.

- [ ] **Step 2: Start Expo dev server in another terminal**

```bash
npm start
```

Expected: Expo dev server running, QR code shown.

- [ ] **Step 3: Boot app in simulator or physical device**

Expected: App boots to login screen (no authenticated user yet).

- [ ] **Step 4: Verify database schema is live**

Check Convex dashboard:
- Tables exist: `users`, `people`, `occasions`, `giftIdeas`, `thirdPartyDeletionRequests`
- Indexes created: `by_email`, `by_userId`, `by_personId`, `by_status`

- [ ] **Step 5: Test signup flow (basic)**

Fill signup form, hit "Create Account". Auth attempt will be logged in console (actual Convex Auth integration happens next phase).

Expected: No runtime errors, form clears or shows confirmation.

- [ ] **Step 6: Verify navigation structure**

After "authentication" (mocked for now), verify:
- Four tabs appear (People, Calendar, Backlog, Profile)
- Each tab shows placeholder screen
- Tabs switch correctly

- [ ] **Step 7: Clean up console warnings**

Fix any missing dependencies, deprecation warnings, or TypeScript issues.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "scaffold: verify end-to-end boot, database schema, and navigation structure"
```

- [ ] **Step 9: Review summary**

**Scaffold complete:**
- ✓ Expo app with TypeScript and Expo Router
- ✓ Convex backend with 5 tables + indexes
- ✓ Queries & mutations for Users, People, Occasions, GiftIdeas (skeleton)
- ✓ Auth gating in root layout
- ✓ Four-tab main navigation (People, Calendar, Backlog, Profile)
- ✓ Login & signup screens (unstyled, placeholder hooks)
- ✓ Convex client configured in React
- ✓ Auth hook + user hook for real-time queries

**Ready for Phase 2:** Build auth integration (Convex Auth email setup), implement first screen (People list), and start wiring queries to UI.

---

## Next Steps

The foundation is ready. The next phase should:
1. **Wire Convex Auth properly** (email/password provider, session management)
2. **Build the People screen** — list, create person, show occasions
3. **Build the Quick Capture screen** — add gift idea, tag people
4. **Connect queries to UI** — use Convex `useQuery` / `useMutation` on real data

See `2026-04-26-gift-tracker-mvp-phase2.md` for detailed screen implementation.
