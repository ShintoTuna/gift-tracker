import type { ComponentType, ReactNode } from "react";

// No-op Sentry shim for web. We don't ship `@sentry/browser` here yet
// to keep the bundle small; once we want web error reporting, swap
// these passthroughs for actual Sentry calls. The `react-native`
// package can't load in a DOM env (it requires native modules), so
// the shim is required, not optional.

export const ERROR_REPORTS_STORAGE_KEY = "error-reports-enabled";

export async function initSentry(): Promise<void> {}

export async function setErrorReportsRuntime(_enabled: boolean): Promise<void> {}

export function wrap<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  return Component;
}

export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return children as ReactNode;
}
