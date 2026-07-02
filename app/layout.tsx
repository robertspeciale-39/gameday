import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Gameday Seller Desk",
  description: "eBay auctions and shipping labels for Gameday Sports Cards",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-chalk font-body text-ink antialiased">
        <header className="bg-ink">
          <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-4">
            <Image
              src="/logo.png"
              alt="Gameday Sports Cards"
              width={132}
              height={62}
              priority
            />
            <div className="h-9 w-px bg-steel/40" aria-hidden />
            <div>
              <p className="font-display text-2xl leading-none tracking-wide text-chalk">
                Seller Desk
              </p>
              <p className="text-xs text-silver">eBay auctions &amp; shipping labels</p>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
