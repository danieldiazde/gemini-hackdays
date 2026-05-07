import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "gemini-hackdays",
  description:
    "Gemini-powered hackathon project — natural-language requests rendered as live UI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
