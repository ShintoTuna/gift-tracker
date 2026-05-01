import AsyncStorage from "@react-native-async-storage/async-storage";
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

// AsyncStorage mirror of `userSettings.errorReportsEnabled` so the
// boot-time gate can decide before Convex (and even auth) is ready.
// Missing = treat as enabled (default-on).
export const ERROR_REPORTS_STORAGE_KEY = "error-reports-enabled";

let initialized = false;

function applyInit() {
  if (initialized) return;
  Sentry.init({
    dsn: DSN,
    // Skip dev: keep your inbox quiet and dashboards clean while
    // iterating. Native crashes during dev are still surfaced by the
    // RN red-screen.
    enabled: !__DEV__,
    environment: __DEV__ ? "development" : "production",
    // `release` / `dist` deliberately omitted: the SDK derives
    // `<bundleId>@<version>+<build>` from native build metadata, which
    // is also what the expo plugin tags uploaded source maps with.
    // Setting `release` here desyncs the two and breaks symbolication.

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
  initialized = true;
}

// Async because it consults AsyncStorage for the user's opt-out.
// Caller in _layout.tsx fires-and-forgets — first frame may render
// before init resolves; any thrown error during that brief window is
// just not captured, which is acceptable.
export async function initSentry(): Promise<void> {
  if (!DSN) return;
  let cached: string | null = null;
  try {
    cached = await AsyncStorage.getItem(ERROR_REPORTS_STORAGE_KEY);
  } catch {
    // ignore — fall through to default-on
  }
  if (cached === "false") return;
  applyInit();
}

// Runtime toggle for the Settings screen. Persists to AsyncStorage
// (boot-time source of truth) and either initializes Sentry or closes
// the existing client. Convex persistence is a separate write done by
// the caller via `setErrorReportsEnabled` mutation.
export async function setErrorReportsRuntime(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(
      ERROR_REPORTS_STORAGE_KEY,
      enabled ? "true" : "false",
    );
  } catch {
    // Best-effort cache write.
  }
  if (!DSN) return;
  if (enabled) {
    applyInit();
  } else if (initialized) {
    await Sentry.close();
    initialized = false;
  }
}

// Re-export the wrap HOC so callers don't need to pull from
// @sentry/react-native directly. When Sentry isn't initialized
// (no DSN), `wrap` still returns a passthrough component.
export const wrap = Sentry.wrap;
export const GlobalErrorBoundary = Sentry.GlobalErrorBoundary;
