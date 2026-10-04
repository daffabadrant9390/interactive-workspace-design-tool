import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Your Workspace | CiptaForge",
  description:
    "Interactively design your rental workspace: pick a desk, chair, monitors and more, then rent the whole setup.",
};

// Runs before paint via the inline script below, so a returning visitor's
// saved theme applies immediately instead of flashing dark-then-light (or
// vice versa). Kept tiny and dependency-free on purpose — it reads the same
// localStorage key zustand's persist middleware writes to (see ui-store.ts),
// without needing to pull the whole store into a blocking script.
const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem("ciptaforge-ui-prefs");
    var theme = raw ? JSON.parse(raw).state.theme : "dark";
    document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
