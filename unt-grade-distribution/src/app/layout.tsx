import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import "./globals.css";

const termFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-term",
});

export const metadata: Metadata = {
  title: "UNT Grade Distribution",
  description:
    "Explore grade distributions for courses and professors at the University of North Texas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={termFont.variable}>
      <body className="bg-black font-mono text-[15px] leading-6 text-neutral-300 antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
