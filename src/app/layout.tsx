import type { Metadata } from "next";
import { Instrument_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Munshi · Hire a voice receptionist by explaining the job",
  description: "Explain the job. Test the receptionist. Fix what goes wrong. Then let it answer. Built on ElevenLabs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${instrument.variable} ${devanagari.variable} antialiased min-h-dvh`}>{children}</body>
    </html>
  );
}
