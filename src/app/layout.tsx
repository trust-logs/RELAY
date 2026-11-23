import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RELAY — Make it happen",
  description:
    "Turn everyday needs and ambitious projects into coordinated, trackable work with RELAY.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
