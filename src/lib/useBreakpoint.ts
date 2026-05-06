import { Platform, useWindowDimensions } from "react-native";

// Width at which we switch from the phone-column layout to a
// sidebar-plus-content desktop layout. ~900px is wide enough that a
// 220px sidebar still leaves a comfortable reading column for the
// main content, and narrow enough that most laptop browsers and
// landscape iPads land on the desktop layout.
export const DESKTOP_BREAKPOINT = 900;

export type Breakpoint = "mobile" | "desktop";

// Returns the current breakpoint. Always "mobile" on native — the
// desktop layout is web-only since native already has a polished
// phone UI and wider tablet treatments aren't on the roadmap yet.
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  if (Platform.OS !== "web") return "mobile";
  return width >= DESKTOP_BREAKPOINT ? "desktop" : "mobile";
}
