import { Alert, Platform } from "react-native";

// `Alert.alert` from react-native-web is unreliable: multi-button
// confirms render no UI at all, and single-button forms fall back to
// `window.alert` only when the polyfill is loaded. Routing through
// these helpers keeps the web bundle on `window.alert` /
// `window.confirm` and the native bundle on the real `Alert.alert`.

export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const body = message ? `${title}\n\n${message}` : title;
      window.alert(body);
    }
    return;
  }
  Alert.alert(title, message);
}

export function confirmDestructive(opts: {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
}): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return Promise.resolve(false);
    const body = opts.message ? `${opts.title}\n\n${opts.message}` : opts.title;
    return Promise.resolve(window.confirm(body));
  }
  return new Promise((resolve) => {
    Alert.alert(opts.title, opts.message, [
      {
        text: opts.cancelLabel,
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: opts.confirmLabel,
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}
