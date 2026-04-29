import Constants from "expo-constants";
import * as Localization from "expo-localization";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Foreground display config — without this, push notifications that
// arrive while the app is in the foreground are silently dropped on
// iOS. We show the banner + sound + list entry like a backgrounded
// arrival so behavior is consistent.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Asks the system permission and (if granted) returns the device's
// Expo push token. Returns null when:
//   - the user denies the prompt
//   - the EAS project id is missing from the runtime config (dev with
//     a missing extras block — surfaces as a no-op rather than a crash)
//   - we're running on a simulator (push tokens require a real device)
export async function requestPermissionsAndGetToken(): Promise<string | null> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return null;

  // EAS project id is the source of truth for Expo's push service —
  // pulled from app.json's `extra.eas.projectId`.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;
  if (!projectId) return null;

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data;
  } catch {
    // Simulator / network / config error — fall through to null. The
    // caller treats this as "no token, don't register".
    return null;
  }
}

// IANA timezone for the device, e.g. "Europe/Berlin". Used to capture
// the user's tz on first opt-in so the cron knows when "9am" is for
// them. Falls back to UTC if expo-localization fails to resolve.
export function getDeviceTimezone(): string {
  const calendars = Localization.getCalendars();
  return calendars[0]?.timeZone ?? "UTC";
}

// Re-derives the current device's Expo push token. Used by the
// sign-out flow to unregister proactively. Cheap on iOS — Expo caches
// the token internally — but we tolerate it returning null (e.g.
// permission revoked between sessions) by treating that as "nothing
// to unregister".
export async function getStoredPushToken(): Promise<string | null> {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId;
    if (!projectId) return null;
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data;
  } catch {
    return null;
  }
}
