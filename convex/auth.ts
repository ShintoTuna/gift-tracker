import Apple from "@auth/core/providers/apple";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

// Email/password is intentionally absent — Giftsmith ships with Apple +
// Google OAuth only. Apple is required by App Store guidelines whenever
// a third-party social login (Google) is offered.
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
      // build, matches `scheme` in app.json) are the only valid schemes.
      const allowed = ["exp://", "giftsmith://"];
      if (!allowed.some((p) => redirectTo.startsWith(p))) {
        throw new Error(`Invalid redirectTo URI ${redirectTo}`);
      }
      return redirectTo;
    },
  },
});
