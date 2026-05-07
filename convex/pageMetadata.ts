"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { action } from "./_generated/server";

// Best-effort title scraper — pulls a usable title off a source URL so
// the gift-idea form can offer it as a one-tap suggestion. Pairs with
// `imageFromUrl.fetchFromUrl` (image extraction) but keeps a separate
// codepath because the lifecycles differ: title fetch is auto-on-paste
// and returns a string, image fetch is a manual button that uploads to
// Convex storage. The duplicated HTML round-trip is cheap relative to
// the round-trip the user is already paying for the image step.

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Cap the suggestion at the same 200-char ceiling as `giftTitle` (see
// convex/lib/validate.ts). The mutation will reject anything longer
// anyway, and a one-line hint is the only way the UI stays readable.
const MAX_TITLE_LENGTH = 200;

const TITLE_PATTERNS: RegExp[] = [
  /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i,
  /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["'][^>]*>/i,
  /<title[^>]*>([\s\S]*?)<\/title>/i,
];

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith("#")) {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named ?? match;
  });
}

function extractTitle(html: string): string | null {
  for (const pattern of TITLE_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const decoded = decodeHtmlEntities(match[1]);
      const collapsed = decoded.replace(/\s+/g, " ").trim();
      if (collapsed.length > 0) {
        return collapsed.length > MAX_TITLE_LENGTH
          ? collapsed.slice(0, MAX_TITLE_LENGTH)
          : collapsed;
      }
    }
  }
  return null;
}

export const fetchTitle = action({
  args: { url: v.string() },
  handler: async (ctx, { url }): Promise<{ title: string | null }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");

    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      // Don't throw on 4xx/5xx — a missing title is a non-event for the
      // user, and many retailers 403 anything that smells like a bot.
      return { title: null };
    }
    const html = await res.text();
    return { title: extractTitle(html) };
  },
});
