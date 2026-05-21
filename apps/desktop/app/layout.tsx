import "./globals.css";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaseSpace Desktop",
  description:
    "CaseSpace \u2014 case-first investigation workspace with native ingest, review, artifacts, search, billing, and reporting.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={montserrat.variable}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
