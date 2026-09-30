import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Your Workspace | CiptaForge",
  description:
    "Interactively design your rental workspace: pick a desk, chair, monitors and more, then rent the whole setup.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
