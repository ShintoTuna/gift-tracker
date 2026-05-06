import Apple from "@auth/core/providers/apple";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

import { ResendOTP } from "./ResendOTP";

// Three providers, all surfaced on the login screen:
//   * Apple — required by App Store rules whenever any third-party
//     social login is offered.
//   * Google — second OAuth path.
//   * ResendOTP — emailed 8-digit code, the no-third-party-account
//     fallback. Same flow handles signup and signin: a fresh email
//     hits `createOrUpdateUser` with `existingUserId === undefined`
//     and inserts a new row; a returning email reuses the existing
//     row.
//
// Apple's `name` is shared by the IdP only on the very first sign-in,
// so we capture it in the `profile` callback and stash it on the user
// row via `createOrUpdateUser`. Subsequent sign-ins hit the
// `existingUserId` branch and we do NOT overwrite a stored name with a
// later `undefined`.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Apple({
      profile: (appleInfo) => {
        const u = (appleInfo as { user?: { name?: { firstName?: string; lastName?: string } } }).user;
        const name = u?.name
          ? `${u.name.firstName ?? ""} ${u.name.lastName ?? ""}`.trim()
          : undefined;
        return {
          id: appleInfo.sub as string,
          name: name && name.length > 0 ? name : undefined,
          email: appleInfo.email as string | undefined,
        };
      },
    }),
    Google,
    ResendOTP,
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        // Returning user: keep their stored name/email/custom fields
        // intact. Apple/Google may not re-share name on re-login.
        return args.existingUserId;
      }
      return await ctx.db.insert("users", {
        name: args.profile.name as string | undefined,
        email: args.profile.email as string | undefined,
        image: args.profile.image as string | undefined,
        subscriptionTier: "free" as const,
        aiUsageThisPeriod: 0,
        createdAt: Date.now(),
      });
    },
    async redirect({ redirectTo }) {
      // Lock down where Convex Auth is allowed to send the user after
      // OAuth completes. exp:// (Expo dev) and giftsmith:// (production
      // build, matches `scheme` in app.json) cover native; the web
      // build redirects back to localhost in dev or to `WEB_SITE_URL`
      // in prod (set in the Convex dashboard env).
      const allowedNative = ["exp://", "giftsmith://"];
      const allowedWebOrigins = [
        "http://localhost:8081",
        "http://localhost:19006",
        process.env.WEB_SITE_URL,
      ].filter((s): s is string => typeof s === "string" && s.length > 0);
      const okNative = allowedNative.some((p) => redirectTo.startsWith(p));
      const okWeb = allowedWebOrigins.some((origin) =>
        redirectTo.startsWith(origin),
      );
      if (!okNative && !okWeb) {
        throw new Error(`Invalid redirectTo URI ${redirectTo}`);
      }
      return redirectTo;
    },
  },
});
