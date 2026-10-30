import type { Metadata } from "next";
import { Calistoga, Instrument_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "500", "600"] });
const calistoga = Calistoga({ variable: "--font-calistoga", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Munshi · Your business's voice receptionist",
  description: "Explain your business like you'd brief a new receptionist. Munshi answers every call in Hindi or English, books visits and tells you who needs a call back.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${instrument.variable} ${devanagari.variable} ${calistoga.variable} antialiased min-h-dvh`}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
