import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한입 유럽",
  description: "한국어 유럽 미식 가이드",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
