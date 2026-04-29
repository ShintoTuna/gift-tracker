"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { action } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Best-effort scraper: pulls the OpenGraph (or Twitter card) image
// off a source URL and stashes it in Convex storage. Used by the
// gift-idea forms to pre-fill the image slot when the user has
// pasted a product URL but hasn't picked a photo themselves.
//
// Resolves to a storage id on success; throws on any failure
// (no og:image meta, network error, image too large) so the client
// can surface a friendly toast and let the user fall back to the
// manual library picker.
//
// Action runs in the Node runtime so we can use `Buffer` + a real
// global `fetch` against arbitrary external hosts (the V8 runtime
// has fetch but stricter sandboxing).

// Caps the downloaded image at ~3 MB so a stray 4K hero asset
// doesn't blow our storage budget. Average og:image is ~200 KB; if
// a site exceeds the cap we just give up and let the user pick.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const META_PATTERNS: RegExp[] = [
  /<meta[^>]+property=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url|:url)?["'][^>]*>/i,
  /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/i,
];

function extractImageUrl(html: string, baseUrl: string): string | null {
  for (const pattern of META_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        return new URL(match[1], baseUrl).toString();
      } catch {
        continue;
      }
    }
  }
  return null;
}

export const fetchFromUrl = action({
  args: { url: v.string() },
  handler: async (
    ctx,
    { url },
  ): Promise<{ storageId: Id<"_storage">; previewUrl: string | null }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    // Page fetch with a recognisable UA — some hosts return a
    // stripped-down page or a 403 to anonymous bots.
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Giftsmith/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!pageRes.ok) {
      throw new Error(`Source returned ${pageRes.status}`);
    }
    const html = await pageRes.text();
    const imageUrl = extractImageUrl(html, url);
    if (!imageUrl) {
      throw new Error("No image found on source page");
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Image fetch failed: ${imgRes.status}`);
    }
    const buf = await imgRes.arrayBuffer();
    if (buf.byteLength > MAX_IMAGE_BYTES) {
      throw new Error("Image too large");
    }
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const storageId = await ctx.storage.store(
      new Blob([buf], { type: contentType }),
    );
    const previewUrl = await ctx.storage.getUrl(storageId);
    return { storageId, previewUrl };
  },
});
