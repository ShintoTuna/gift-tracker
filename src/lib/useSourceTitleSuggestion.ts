import { useAction } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../../convex/_generated/api";

const DEBOUNCE_MS = 100;
// Cap both the rendered pill and the title pasted into the field to a
// length that comfortably fits one line of pill UI. Longer scraped
// titles get a trailing ellipsis so the user sees that more was
// available and can extend the title manually if they care.
const SUGGESTION_MAX_CHARS = 50;

function truncateSuggestion(raw: string): string {
  return raw.length > SUGGESTION_MAX_CHARS
    ? `${raw.slice(0, SUGGESTION_MAX_CHARS)}…`
    : raw;
}

function looksLikeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

// Watches the Source URL field and asks the server for a title hint
// once the user has stopped typing. The suggestion is best-effort —
// errors are swallowed silently (no toast) because a missing title is
// a non-event compared to e.g. a failed save.
//
// The hook owns three pieces of state:
//   - `suggestion`: the title to render in the hint, or null
//   - `loading`:    debounce/fetch in flight for the *current* URL
//   - cache:        per-URL memo so editing back to a previously-seen
//                   URL doesn't re-fetch
//
// `dismiss()` clears the suggestion for the current URL until the user
// changes the URL again — used after the hint is tapped so it doesn't
// linger on screen.
export function useSourceTitleSuggestion(sourceUrl: string): {
  suggestion: string | null;
  loading: boolean;
  dismiss: () => void;
} {
  const fetchTitle = useAction(api.pageMetadata.fetchTitle);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Per-URL cache. `null` means "we asked and got nothing usable" so we
  // don't re-ask. `"__dismissed__"` is a sentinel that means "user tapped
  // the hint for this URL" so we suppress it until the URL changes.
  const cacheRef = useRef<Map<string, string | null>>(new Map());
  const dismissedRef = useRef<Set<string>>(new Set());
  // Track the latest URL so a stale in-flight resolution doesn't
  // overwrite the suggestion for the URL the user is now on.
  const latestUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const normalized = looksLikeUrl(sourceUrl);
    latestUrlRef.current = normalized;

    if (normalized === null) {
      setSuggestion(null);
      setLoading(false);
      return;
    }

    if (dismissedRef.current.has(normalized)) {
      setSuggestion(null);
      setLoading(false);
      return;
    }

    if (cacheRef.current.has(normalized)) {
      setSuggestion(cacheRef.current.get(normalized) ?? null);
      setLoading(false);
      return;
    }

    setSuggestion(null);
    setLoading(true);

    const handle = setTimeout(async () => {
      try {
        const result = await fetchTitle({ url: normalized });
        const truncated = result.title ? truncateSuggestion(result.title) : null;
        cacheRef.current.set(normalized, truncated);
        if (latestUrlRef.current !== normalized) return;
        if (dismissedRef.current.has(normalized)) return;
        setSuggestion(truncated);
      } catch (err) {
        console.warn("fetchTitle failed", err);
        cacheRef.current.set(normalized, null);
        if (latestUrlRef.current === normalized) {
          setSuggestion(null);
        }
      } finally {
        if (latestUrlRef.current === normalized) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(handle);
    };
  }, [sourceUrl, fetchTitle]);

  const dismiss = useCallback(() => {
    const normalized = latestUrlRef.current;
    if (normalized) dismissedRef.current.add(normalized);
    setSuggestion(null);
  }, []);

  return { suggestion, loading, dismiss };
}
