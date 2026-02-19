import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finio — Personal Budget Tracker",
  description: "A modern personal budgeting app with envelope budgeting, expense tracking, and beautiful charts.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <Navbar />
          {/* pb-20 on mobile for the bottom tab bar; md:pb-0 resets on desktop */}
          <main className="min-h-screen pt-16 pb-20 md:pb-0">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
