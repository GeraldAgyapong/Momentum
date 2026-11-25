import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Momentum — Build habits. Build yourself.",
  description: "A premium habit tracking and personal consistency platform designed for sustainable behavioural improvement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-sage selection:text-forest`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
