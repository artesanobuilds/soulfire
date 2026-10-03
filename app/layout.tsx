import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "soulfire — a little room to begin",
  description: "A spiritual practice companion. Proof of Concept One.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
