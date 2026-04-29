import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

// Sentry crash + error reporting.
//
// Tuned for the Sentry free tier: errors and breadcrumbs only.
// Performance tracing, profiling, replays, and Sentry Logs are all
// disabled to avoid burning monthly quota. Breadcrumbs (UI touches,
// navigation, console output, network) are kept on so each error event
// arrives with the user actions that led up to it.
//
// The DSN is read from `EXPO_PUBLIC_SENTRY_DSN`. EXPO_PUBLIC_* values
// are baked into the bundle at build time, so flipping the var
// requires a rebuild. If the var is missing we no-op rather than
// throw, which keeps local dev / forks runnable without a Sentry
// account.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry(): void {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    // Skip dev: keep your inbox quiet and dashboards clean while
    // iterating. Native crashes during dev are still surfaced by the
    // RN red-screen.
    enabled: !__DEV__,
    environment: __DEV__ ? "development" : "production",
    // Tie events to the binary version (matches `runtimeVersion` in
    // app.json's "appVersion" policy). Source maps uploaded by the
    // Sentry expo plugin index against the same value.
    release: Constants.expoConfig?.version,

    // --- Free-tier guardrails ------------------------------------
    // No performance tracing, profiling, or replay. Each is its own
    // billable product on Sentry; we want errors only.
    tracesSampleRate: 0,
    profilesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    enableAutoPerformanceTracing: false,
    // Do not forward console.* / native logs to Sentry Logs.
    // Breadcrumbs are unaffected — they ride along on error events.
    enableLogs: false,
    // ------------------------------------------------------------

    // Defaults below are explicit so future SDK upgrades don't quietly
    // flip them on.
    attachScreenshot: false,
    attachViewHierarchy: false,
    sendDefaultPii: false,
    // Breadcrumbs: leave the SDK default (100). They're attached to
    // error events, not sent independently, so they don't cost extra.
  });
}

// Re-export the wrap HOC so callers don't need to pull from
// @sentry/react-native directly. When Sentry isn't initialized
// (no DSN), `wrap` still returns a passthrough component.
export const wrap = Sentry.wrap;
export const GlobalErrorBoundary = Sentry.GlobalErrorBoundary;
