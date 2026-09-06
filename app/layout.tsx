import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI House Designer",
  description: "Design your dream home with AI — turn your plot into a house plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
