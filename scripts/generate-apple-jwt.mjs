#!/usr/bin/env node
// Sign an Apple Sign-in client_secret JWT.
//
// Apple expects AUTH_APPLE_SECRET to be a JWT signed by your `.p8`
// private key, *not* the raw key. The JWT must be regenerated every
// 6 months (Apple caps `exp - iat` at ~6 months).
//
// Usage:
//   node scripts/generate-apple-jwt.mjs \
//     --service-id com.shatunov.giftsmith.web \
//     --team-id    SNJ685WAZL \
//     --key-id     YGK9C96N8N \
//     --p8         ~/Desktop/AuthKey_YGK9C96N8N.p8
//
// Outputs the JWT on stdout. Capture and feed into:
//   npx convex env set AUTH_APPLE_SECRET "$JWT"
//   npx convex env set --prod AUTH_APPLE_SECRET "$JWT"
//
// To rotate before expiry: re-run with the same inputs, set both envs
// again, redeploy is NOT required (env vars are read at runtime).

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { SignJWT, importPKCS8 } from "jose";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, idx, arr) => {
    if (cur.startsWith("--") && idx + 1 < arr.length) {
      acc.push([cur.slice(2), arr[idx + 1]]);
    }
    return acc;
  }, []),
);

const required = ["service-id", "team-id", "key-id", "p8"];
for (const k of required) {
  if (!args[k]) {
    console.error(`Missing required arg --${k}`);
    process.exit(1);
  }
}

const p8Path = args.p8.startsWith("~/")
  ? resolve(homedir(), args.p8.slice(2))
  : resolve(args.p8);
const pkcs8 = readFileSync(p8Path, "utf8");

const privateKey = await importPKCS8(pkcs8, "ES256");

const now = Math.floor(Date.now() / 1000);
const sixMonths = 60 * 60 * 24 * 180; // Apple caps at ~6 months.

const jwt = await new SignJWT({})
  .setProtectedHeader({ alg: "ES256", kid: args["key-id"] })
  .setIssuer(args["team-id"])
  .setAudience("https://appleid.apple.com")
  .setSubject(args["service-id"])
  .setIssuedAt(now)
  .setExpirationTime(now + sixMonths)
  .sign(privateKey);

const expiryDate = new Date((now + sixMonths) * 1000).toISOString();
console.error(`Generated. Expires: ${expiryDate}`);
process.stdout.write(jwt);
