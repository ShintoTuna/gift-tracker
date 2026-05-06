// Web shim. The native sibling pulls in `expo-notifications`, which
// auto-registers a push-token listener at import time and prints
// "Listening to push token changes is not yet fully supported on
// web" to the console. Web has no push surface, so we just stub
// the same exports — Metro picks this file over `notifications.ts`
// for the web bundle and the warning never fires.

export async function requestPermissionsAndGetToken(): Promise<string | null> {
  return null;
}

export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  return null;
}
