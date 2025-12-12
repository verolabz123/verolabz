import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { HydrationProvider } from "@/components/HydrationProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verolabz - SaaS Hiring Automation Platform",
  description:
    "Automate resume screening. Hire 10x faster with AI-powered resume parsing, scoring, and matching.",
  keywords: [
    "hiring automation",
    "resume parsing",
    "ATS",
    "recruitment software",
    "HR tech",
  ],
  openGraph: {
    title: "Verolabz - SaaS Hiring Automation Platform",
    description: "Automate resume screening. Hire 10x faster.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <HydrationProvider>
          {children}
          <Toaster />
        </HydrationProvider>
      </body>
    </html>
  );
}
