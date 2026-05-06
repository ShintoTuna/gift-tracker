import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

import { colors } from "@/theme/tokens";

// Customizes the static-export HTML document for the web build.
// The default template paints the document body white, which leaks
// through as gray gutters around the centered app shell on every
// screen (login, tabs, modals). Pin the body to the app background
// color so anything outside the React tree — overscroll bounce,
// the area around the centered frame — matches the in-app dark
// surface.
export default function Document({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body { background-color: ${colors.bg}; }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
