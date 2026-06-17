import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const cormorantSerif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"]
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: {
    default: "Hush Crafts | Luxury Handmade Slippers Sri Lanka",
    template: "%s | Hush Crafts Sri Lanka"
  },
  description:
    "Shop premium handmade slippers in Sri Lanka. Tailored, elegant, and comfortable footwear designed for women. Cash on delivery island-wide.",
  keywords: [
    "handmade slippers Sri Lanka",
    "custom slippers Colombo",
    "ladies footwear Sri Lanka",
    "Hush Crafts slippers"
  ],
  openGraph: {
    type: "website",
    locale: "en_LK",
    url: "https://hushcraft.lk",
    siteName: "Hush Crafts",
    images: [
      {
        url: "https://hushcraft.lk/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Hush Crafts Handmade Footwear"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Hush Crafts | Handmade Slippers",
    description: "Shop elegant handmade slippers in Sri Lanka.",
    images: ["https://hushcraft.lk/og-home.jpg"]
  },
  alternates: { canonical: "https://hushcraft.lk" }
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorantSerif.variable} ${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
