import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { type RandomReader, generateRandomString } from "@oslojs/crypto/random";

// 8-digit numeric OTP delivered by email. Convex Auth's Resend
// provider hands us the plumbing (token storage, expiry, single-use,
// signup-or-signin uniformity) — we only supply token generation
// and the actual send. `onboarding@resend.dev` is Resend's shared
// sandbox sender; swap to a verified giftsmith.app sender once the
// domain is added in the Resend dashboard.
export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 8);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Giftsmith <noreply@mail.giftsmith.app>",
      to: [email],
      subject: "Your Giftsmith sign-in code",
      text: `Your sign-in code is ${token}\n\nIt expires shortly. If you didn't request this, you can ignore this email.`,
    });
    if (error) {
      throw new Error("Could not send sign-in email");
    }
  },
});
